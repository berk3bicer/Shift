using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.Create;

public class CreateTimeOffHandler
    : IRequestHandler<CreateTimeOffCommand, CreateTimeOffResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public CreateTimeOffHandler(
        IShiftDbContext db,
        ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateTimeOffResult> Handle(
        CreateTimeOffCommand request, CancellationToken ct)
    {
        // Talebi oluşturan = login olan kullanıcı. CLIENT'tan değil, TOKEN'dan.
        // Böylece personel başkasının adına izin talebi açamaz.
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // FK güvenliği: kullanıcı bu tenant'ta gerçekten var mı? (global filter altında)
        // Token geçerli olsa bile, kullanıcı silinmiş/başka tenant olabilir.
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId.Value, ct);
        if (!userExists)
            throw new InvalidOperationException("Personel bulunamadı.");

        var timeOff = new TimeOffRequest
        {
            // TenantId YOK — interceptor damgalar.
            UserId = userId.Value,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Type = request.Type,
            Reason = request.Reason
            // Status YOK — entity'de default Pending. Talep her zaman beklemede doğar.
            // DecidedByUserId / DecisionNote YOK — karar verilince dolacak.
        };

        _db.TimeOffRequests.Add(timeOff);

        // ── YÖNETİCİ BİLDİRİMİ ──
        // İzin talebi aksiyon gerektirir → talep edenin şube(ler)indeki Manager'lar +
        // tüm Owner'lar bilgilendirilir (ClockInHandler.NotifyManagersAsync ile aynı hedef
        // kitle mantığı). Talep + bildirimler tek SaveChanges → atomik.
        // Spec §5.2: kanal Push + E-posta; şimdilik yalnız in-app Notification (FCM/SMTP yok).
        await NotifyManagersAsync(userId.Value, timeOff.Id, ct);

        await _db.SaveChangesAsync(ct);

        return new CreateTimeOffResult(timeOff.Id);
    }

    // İzin talebini görecek yöneticileri bulur ve Notification ekler. Hedef:
    // (a) talep edenin atandığı şube(ler)deki Manager'lar (UserBranch üzerinden — personel
    //     çok şubeliyse her şubenin yöneticisi), (b) tüm Owner'lar (Owner UserBranch'te yok —
    //     kapsamı tüm tenant). Talep edenin kendisi hariç.
    private async Task NotifyManagersAsync(Guid requesterId, Guid timeOffId, CancellationToken ct)
    {
        // Talep edenin atandığı şubeler.
        var requesterBranchIds = await _db.UserBranches
            .Where(ub => ub.UserId == requesterId)
            .Select(ub => ub.BranchId)
            .ToListAsync(ct);

        // (a) Bu şubelerdeki Manager rolüne sahip kullanıcı id'leri.
        var branchManagerIds = await _db.UserBranches
            .Where(ub => requesterBranchIds.Contains(ub.BranchId))
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

        // Birleştir, tekilleştir, talep edenin kendisini çıkar
        // (kişi hem talep eden hem yönetici/owner olabilir — kendine bildirim gitmesin).
        var targetIds = branchManagerIds
            .Union(ownerIds)
            .Where(id => id != requesterId)
            .ToList();

        foreach (var managerId in targetIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = managerId,
                Type = NotificationType.TimeOffRequested,
                Message = "Bir personel izin talebi oluşturdu.",
                RelatedEntityId = timeOffId,   // tıkla → izin talebine git
                IsRead = false
            });
        }
    }
}