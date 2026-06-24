using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Common.Services.Overtime;

// Mesai hesap motoru. TimeClock kayıtlarını İş Kanunu'na göre işler.
// Saf hesap servisi: hiçbir şey yazmaz, sadece okur ve hesaplar.
public class OvertimeCalculator : IOvertimeCalculator
{
    private readonly IShiftDbContext _db;

    public OvertimeCalculator(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<StaffOvertimeSummary> CalculateForUserAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct)
    {
        // ── 1) Ayarları oku (lazy default) ──
        // Eşik (45) ve fazla mesai çarpanı (1.5) ayardan gelir; kayıt yoksa
        // entity varsayılanları kullanılır. Calculator okur, asla yazmaz.
        var settings = await _db.OvertimeSettings.FirstOrDefaultAsync(ct);
        var threshold = settings?.WeeklyOvertimeThresholdHours ?? 45m;
        var overtimeMultiplier = settings?.OvertimeMultiplier ?? 1.5m;

        // ── 2) Personel + birincil pozisyonunun saat ücreti ──
        // PositionId null olabilir (pozisyon atanmamış); Position.HourlyRate de
        // null olabilir (ücret girilmemiş). İkisinden biri null → ücret hesabı yok.
        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.FullName,
                HourlyRate = u.Position != null ? u.Position.HourlyRate : null
            })
            .FirstOrDefaultAsync(ct);

        if (user is null)
            throw new InvalidOperationException("Personel bulunamadı.");

        // ── 3) Dönemin KAPALI TimeClock kayıtlarını çek ──
        var fromDt = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toDt = to.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc); // to günü dahil

        var records = await _db.TimeClocks
            .Where(tc => tc.UserId == userId
                      && tc.CheckOutTime != null
                      && tc.CheckInTime >= fromDt
                      && tc.CheckInTime < toDt)
            .Select(tc => new { tc.CheckInTime, CheckOut = tc.CheckOutTime!.Value })
            .ToListAsync(ct);

        // ── 4) Kayıtları HAFTALARA grupla ──
        var weeklyGroups = records
            .GroupBy(r => GetWeekStart(DateOnly.FromDateTime(r.CheckInTime)))
            .OrderBy(g => g.Key);

        var weeks = new List<WeeklyOvertimeBreakdown>();

        foreach (var group in weeklyGroups)
        {
            var totalHours = (decimal)group
                .Sum(r => (r.CheckOut - r.CheckInTime).TotalHours);

            var normalHours = Math.Min(totalHours, threshold);
            var overtimeHours = Math.Max(0m, totalHours - threshold);

            weeks.Add(new WeeklyOvertimeBreakdown(
                WeekStart: group.Key,
                TotalHours: Round(totalHours),
                NormalHours: Round(normalHours),
                OvertimeHours: Round(overtimeHours)));
        }

        // ── 5) Dönem saat toplamları ──
        var totalNormal = Round(weeks.Sum(w => w.NormalHours));
        var totalOvertime = Round(weeks.Sum(w => w.OvertimeHours));
        var totalAll = Round(weeks.Sum(w => w.TotalHours));

        // ── 6) Brüt ücret hesabı ──
        // Ücret tanımlıysa: brüt = normal×ücret + fazla×ücret×çarpan.
        // Tanımsızsa (ücret null): üç alan da null döner — "hesaplanamadı".
        decimal? appliedRate = user.HourlyRate;
        decimal? appliedMultiplier = null;
        decimal? grossAmount = null;

        if (appliedRate is { } rate)
        {
            appliedMultiplier = overtimeMultiplier;
            var normalPay = totalNormal * rate;
            var overtimePay = totalOvertime * rate * overtimeMultiplier;
            grossAmount = RoundMoney(normalPay + overtimePay);
        }

        return new StaffOvertimeSummary(
            UserId: userId,
            UserFullName: user.FullName,
            TotalHours: totalAll,
            NormalHours: totalNormal,
            OvertimeHours: totalOvertime,
            Weeks: weeks,
            AppliedHourlyRate: appliedRate,
            OvertimeMultiplier: appliedMultiplier,
            GrossAmount: grossAmount);
    }

    // Bir günün düştüğü haftanın Pazartesi'sini döner (deterministik).
    private static DateOnly GetWeekStart(DateOnly date)
    {
        var daysSinceMonday = ((int)date.DayOfWeek - 1 + 7) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    // Saatleri 2 ondalığa yuvarla.
    private static decimal Round(decimal hours)
        => Math.Round(hours, 2, MidpointRounding.AwayFromZero);

    // Parayı 2 ondalığa yuvarla (kuruş). Saat yuvarlamayla aynı kural ama
    // ayrı isim — niyet net olsun (biri saat, biri para).
    private static decimal RoundMoney(decimal amount)
        => Math.Round(amount, 2, MidpointRounding.AwayFromZero);
}