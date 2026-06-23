using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeClocks.ClockIn;

public class ClockInHandler : IRequestHandler<ClockInCommand, ClockInResult>
{
    // Geç giriş toleransı (grace period). Vardiya başlangıcından bu kadar
    // dakika sonrasına kadar "geç" sayılmaz. Sabit — sonra Tenant ayarına
    // taşınacak (refactor borcu, şimdilik YAGNI).
    private const int LateGraceMinutes = 5;

    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public ClockInHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ClockInResult> Handle(ClockInCommand request, CancellationToken ct)
    {
        // Giriş yapan = login olan kullanıcı (token'dan, sahtelenemez).
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // ── 1) ŞUBE GÜVENLİĞİ (IDOR koruması) ──
        // Şube gerçekten bizim tenant'ımıza mı ait? Global filter altında
        // AnyAsync → başka tenant'ın şubesine giriş yapılamaz.
        var branchExists = await _db.Branches
            .AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        // ── 2) AÇIK KAYIT KONTROLÜ (state machine) ──
        // Bu personelin çıkış yapılmamış (CheckOutTime == null) bir kaydı var mı?
        // Varsa ikinci giriş YASAK — önce çıkış yapmalı. (UserId+CheckOutTime index'i
        // bu sorguyu hızlandırır.)
        var hasOpenRecord = await _db.TimeClocks
            .AnyAsync(tc => tc.UserId == userId.Value && tc.CheckOutTime == null, ct);
        if (hasOpenRecord)
            throw new InvalidOperationException(
                "Zaten açık bir giriş kaydınız var. Önce çıkış yapmalısınız.");

        var now = DateTime.UtcNow;

        // ── 3) GEÇ GİRİŞ TESPİTİ ──
        // Bu personele atanmış, bu şubedeki, başlangıcı bugüne yakın Published
        // vardiyayı bul. Giriş anı, vardiya başlangıcı + tolerans'tan sonraysa geç.
        // Vardiya yoksa (plansız giriş) geç sayılmaz — kıyaslayacak referans yok.
        var windowStart = now.AddHours(-12);
        var windowEnd = now.AddHours(12);

        var todaysShift = await _db.Shifts
            .Where(s => s.UserId == userId.Value
                     && s.BranchId == request.BranchId
                     && s.Status == ShiftStatus.Published
                     && s.StartTime >= windowStart
                     && s.StartTime <= windowEnd)
            .OrderBy(s => s.StartTime)
            .FirstOrDefaultAsync(ct);

        bool isLate = false;
        if (todaysShift is not null)
        {
            var lateThreshold = todaysShift.StartTime.AddMinutes(LateGraceMinutes);
            isLate = now > lateThreshold;
        }

        // ── 4) PUANTAJ KAYDINI OLUŞTUR ──
        // CheckOutTime null → kayıt "açık". TenantId SaveChanges interceptor'da damgalanır.
        var timeClock = new TimeClock
        {
            UserId = userId.Value,
            BranchId = request.BranchId,
            CheckInTime = now,
            CheckOutTime = null,
            Method = request.Method,
            IsLate = isLate
        };
        _db.TimeClocks.Add(timeClock);

        // ── 5) GEÇ GİRİŞTE YÖNETİCİ BİLDİRİMİ ──
        // Geç gelindiyse şubenin yöneticilerine + sahiplere bildirim.
        if (isLate)
        {
            await NotifyManagersAsync(request.BranchId, userId.Value, ct);
        }

        // Kayıt + bildirimler aynı SaveChanges'te → atomik.
        await _db.SaveChangesAsync(ct);

        return new ClockInResult(timeClock.Id, timeClock.CheckInTime, isLate);
    }

    // Geç giriş bildirimini alacak yöneticileri bulur ve Notification ekler.
    // Hedef: (a) bu şubeye atanmış Manager'lar (UserBranch üzerinden)
    //        (b) tüm Owner'lar (Owner UserBranch'te yok — kapsamı tüm tenant).
    private async Task NotifyManagersAsync(Guid branchId, Guid lateUserId, CancellationToken ct)
    {
        // (a) Bu şubedeki Manager rolüne sahip kullanıcı id'leri.
        var branchManagerIds = await _db.UserBranches
            .Where(ub => ub.BranchId == branchId)
            .Join(_db.UserRoles, ub => ub.UserId, ur => ur.UserId,
                  (ub, ur) => new { ub.UserId, ur.Role.Type })
            .Where(x => x.Type == RoleType.Manager)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(ct);

        // (b) Tüm Owner kullanıcı id'leri (şube bağımsız).
        var ownerIds = await _db.UserRoles
            .Where(ur => ur.Role.Type == RoleType.Owner)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(ct);

        // Birleştir, tekilleştir, geç gelen kişinin kendisini çıkar
        // (kişi hem geç gelen hem owner olabilir — kendine bildirim gitmesin).
        var targetIds = branchManagerIds
            .Union(ownerIds)
            .Where(id => id != lateUserId)
            .ToList();

        foreach (var managerId in targetIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = managerId,
                Type = NotificationType.LateClockIn,
                Message = "Bir personel vardiyasına geç giriş yaptı.",
                RelatedEntityId = lateUserId,   // hangi personel
                IsRead = false
            });
        }
    }
}