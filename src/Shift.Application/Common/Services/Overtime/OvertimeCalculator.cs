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
        // ── 1) Haftalık eşiği ayarlardan oku (lazy default) ──
        // Kayıt yoksa entity varsayılanı (45) kullanılır. Calculator ayarı
        // okur ama asla yazmaz. Global filter zaten doğru tenant'a bakar.
        var settings = await _db.OvertimeSettings.FirstOrDefaultAsync(ct);
        var threshold = settings?.WeeklyOvertimeThresholdHours ?? 45m;

        // ── 2) Personelin adını al (özet kişi bilgisi taşır) ──
        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.FullName })
            .FirstOrDefaultAsync(ct);

        if (user is null)
            throw new InvalidOperationException("Personel bulunamadı.");

        // ── 3) Dönemin TimeClock kayıtlarını çek ──
        // Sadece KAPALI kayıtlar (CheckOutTime != null): açık kaydın süresi
        // henüz belli değil, mesaiye giremez.
        // Dönem sınırı: kaydın giriş günü [from, to] aralığında olmalı.
        // DateOnly'yi DateTime'a çeviriyoruz (TimeClock UTC DateTime tutuyor).
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
        // Her kaydı, giriş gününün düştüğü haftanın Pazartesi'sine eşle.
        // Hafta hesabı ShiftRuleChecker ile AYNI deterministik formül:
        //   geri gidilecek gün = ((int)gün - 1 + 7) % 7  (Pazartesi=0 olacak şekilde)
        var weeklyGroups = records
            .GroupBy(r => GetWeekStart(DateOnly.FromDateTime(r.CheckInTime)))
            .OrderBy(g => g.Key);

        var weeks = new List<WeeklyOvertimeBreakdown>();

        foreach (var group in weeklyGroups)
        {
            // O haftadaki tüm kayıtların süre toplamı (saat).
            var totalHours = (decimal)group
                .Sum(r => (r.CheckOut - r.CheckInTime).TotalHours);

            // Eşiğe kadar olan = normal, üstü = fazla mesai.
            var normalHours = Math.Min(totalHours, threshold);
            var overtimeHours = Math.Max(0m, totalHours - threshold);

            weeks.Add(new WeeklyOvertimeBreakdown(
                WeekStart: group.Key,
                TotalHours: Round(totalHours),
                NormalHours: Round(normalHours),
                OvertimeHours: Round(overtimeHours)));
        }

        // ── 5) Dönem özeti: haftaların toplamı ──
        return new StaffOvertimeSummary(
            UserId: userId,
            UserFullName: user.FullName,
            TotalHours: Round(weeks.Sum(w => w.TotalHours)),
            NormalHours: Round(weeks.Sum(w => w.NormalHours)),
            OvertimeHours: Round(weeks.Sum(w => w.OvertimeHours)),
            Weeks: weeks);
    }

    // Bir günün düştüğü haftanın Pazartesi'sini döner (deterministik).
    // ShiftRuleChecker'daki ((int)DayOfWeek - 1 + 7) % 7 mantığının aynısı.
    private static DateOnly GetWeekStart(DateOnly date)
    {
        var daysSinceMonday = ((int)date.DayOfWeek - 1 + 7) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    // Saatleri 2 ondalığa yuvarla (bordro okunabilirliği). Banker's rounding
    // yerine standart (AwayFromZero) — "8.345 → 8.35" beklenen davranış.
    private static decimal Round(decimal hours)
        => Math.Round(hours, 2, MidpointRounding.AwayFromZero);
}