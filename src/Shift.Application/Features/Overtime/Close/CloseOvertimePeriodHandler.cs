using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Overtime.Close;

// Dönem kapanış akışının kalbi: hesapla → dondur → kilitle → yaz.
public class CloseOvertimePeriodHandler
    : IRequestHandler<CloseOvertimePeriodCommand, Guid>
{
    private readonly IShiftDbContext _db;
    private readonly IOvertimeCalculator _calculator;
    private readonly ICurrentUserProvider _currentUser;

    public CloseOvertimePeriodHandler(
        IShiftDbContext db,
        IOvertimeCalculator calculator,
        ICurrentUserProvider currentUser)
    {
        _db = db;
        _calculator = calculator;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(
        CloseOvertimePeriodCommand request, CancellationToken ct)
    {
        // ── 1) Aynı dönem kaydı var mı? Varsa kilit durumuna göre davran ──
        // Global filter sayesinde bu sorgu yalnızca kendi tenant'ına bakar.
        //   - Kilitli kayıt varsa  → HATA (önce unlock gerekir; bordro korunur).
        //   - Kilitsiz kayıt varsa → ÜZERİNE yeniden yaz (recalculate akışı).
        //   - Hiç yoksa            → yeni oluştur.
        // Not: aynı dönemi tekrar çekerken global filter + (UserId,Period) ile teklik
        // garanti (unique index). FirstOrDefault güvenli.
        var existing = await _db.OvertimeRecords.FirstOrDefaultAsync(
            o => o.UserId == request.UserId
              && o.PeriodStart == request.From
              && o.PeriodEnd == request.To,
            ct);

        if (existing is { IsLocked: true })
            throw new InvalidOperationException(
                "Bu dönem zaten kapalı. Düzeltmek için önce kilidi açın.");

        // ── 2) Mesaiyi hesapla (saf servis) ──
        // Calculator personeli bulamazsa "Personel bulunamadı" fırlatır → 400.
        // Bu, IDOR/tenant korumasını da kapsar (başka tenant'ın personeli görünmez).
        var summary = await _calculator.CalculateForUserAsync(
            request.UserId, request.From, request.To, ct);

        // ── 3) Haftalık kırılımı Domain snapshot'ına map'le (jsonb'ye gidecek) ──
        var now = DateTime.UtcNow;
        var weekSnapshots = summary.Weeks.Select(w => new OvertimeWeekSnapshot
        {
            WeekStart = w.WeekStart,
            TotalHours = w.TotalHours,
            NormalHours = w.NormalHours,
            OvertimeHours = w.OvertimeHours
        }).ToList();

        OvertimeRecord record;

        if (existing is not null)
        {
            // ── Recalculate: kilitsiz mevcut kaydın ÜZERİNE yaz ──
            // (Buraya geldiysek existing kilitsiz — kilitli olsaydı yukarıda dönerdik.)
            // Kayıt korunur (Id, CreatedAt, unlock audit'i sabit kalır); sadece
            // hesaplanan değerler tazelenir ve tekrar kilitlenir.
            record = existing;
            record.TotalHours = summary.TotalHours;
            record.NormalHours = summary.NormalHours;
            record.OvertimeHours = summary.OvertimeHours;
            record.Weeks = weekSnapshots;

            // Yeniden kilitle. Bu kapanışın audit'i LockedAt/LockedBy'ı tazeler;
            // UnlockedAt/UnlockedBy son açılışın izi olarak DURUR (denetim geçmişi).
            record.IsLocked = true;
            record.LockedAt = now;
            record.LockedByUserId = _currentUser.GetUserId();
        }
        else
        {
            // ── Yeni kayıt: dönemi ilk kez kapat ──
            record = new OvertimeRecord
            {
                UserId = request.UserId,
                PeriodStart = request.From,
                PeriodEnd = request.To,
                TotalHours = summary.TotalHours,
                NormalHours = summary.NormalHours,
                OvertimeHours = summary.OvertimeHours,

                // Ücret alanları şimdilik boş (İK modülü gelince doldurulacak).
                AppliedHourlyRate = null,
                OvertimeMultiplier = null,
                GrossAmount = null,

                Weeks = weekSnapshots,

                // Kayıt doğduğu anda donmuş. Kim kapattı → token'dan.
                IsLocked = true,
                LockedAt = now,
                LockedByUserId = _currentUser.GetUserId()
            };

            // TenantId'yi elle set etmiyoruz — SaveChanges interceptor damgalıyor.
            _db.OvertimeRecords.Add(record);
        }

        await _db.SaveChangesAsync(ct);

        return record.Id;
    }
}