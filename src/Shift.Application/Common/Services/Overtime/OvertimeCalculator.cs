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

        // Gece/hafta sonu çarpanları + gece penceresi. Kayıt yoksa entity varsayılanı
        // (1.0 = prim yok). 1.0 olduğunda differential (çarpan−1) sıfır → bordro değişmez.
        var nightMultiplier = settings?.NightMultiplier ?? 1.0m;
        var weekendMultiplier = settings?.WeekendMultiplier ?? 1.0m;
        var nightStart = settings?.NightStart ?? new TimeOnly(20, 0);
        var nightEnd = settings?.NightEnd ?? new TimeOnly(6, 0);

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

        // ── 6) Gece / hafta sonu prim SAATLERİ (vardiya bazında bayrak) ──
        // Karar: çarpan TÜM vardiyaya uygulanır. Bir vardiya gece penceresine bir
        // dakika bile değiyorsa o vardiyanın TÜM saatleri "gece"; check-in'i Cmt/Pzr
        // ise TÜM saatleri "hafta sonu" sayılır. Saatleri burada toplarız; primi (para)
        // ücret bilindiğinde 7. adımda hesaplarız. OT split'inden bağımsız ayrı eksen.
        decimal nightHours = 0m, weekendHours = 0m;
        foreach (var r in records)
        {
            var hours = (decimal)(r.CheckOut - r.CheckInTime).TotalHours;
            if (TouchesNightWindow(r.CheckInTime, r.CheckOut, nightStart, nightEnd))
                nightHours += hours;
            if (IsWeekendShift(r.CheckInTime))
                weekendHours += hours;
        }

        // ── 7) Brüt ücret hesabı ──
        // Ücret tanımlıysa: brüt = normal×ücret + fazla×ücret×fazlaÇarpan + primler.
        // Prim (differential): primli saat × ücret × (çarpan−1); çarpan 1.0 ise prim = 0.
        // Tanımsızsa (ücret null): tüm para alanları null döner — "hesaplanamadı".
        decimal? appliedRate = user.HourlyRate;
        decimal? appliedMultiplier = null;
        decimal? nightPremium = null;
        decimal? weekendPremium = null;
        decimal? grossAmount = null;

        if (appliedRate is { } rate)
        {
            appliedMultiplier = overtimeMultiplier;
            var basePay = RoundMoney(totalNormal * rate + totalOvertime * rate * overtimeMultiplier);
            nightPremium = RoundMoney(nightHours * rate * (nightMultiplier - 1m));
            weekendPremium = RoundMoney(weekendHours * rate * (weekendMultiplier - 1m));
            // Gösterilen kalemlerden topla → CSV'de prim kolonları + brüt birbirini tutar.
            grossAmount = basePay + nightPremium.Value + weekendPremium.Value;
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
            NightPremium: nightPremium,
            WeekendPremium: weekendPremium,
            GrossAmount: grossAmount);
    }

    // Check-in günü Cumartesi/Pazar mı? Karar: vardiyanın günü check-in tarihinden
    // belirlenir (gece yarısını aşan vardiyada başlangıç günü esas). Tüm vardiya
    // bu bayrağa göre primli/primsiz.
    private static bool IsWeekendShift(DateTime checkIn)
    {
        var day = DateOnly.FromDateTime(checkIn).DayOfWeek;
        return day is DayOfWeek.Saturday or DayOfWeek.Sunday;
    }

    // Vardiya [in, out) gece penceresine değiyor mu? Bir dakika bile değiyorsa true
    // (→ tüm vardiya gece sayılır). Pencere gün-içi tekrar eder ve gece yarısını
    // sarabilir (ör. 20:00–06:00). Saat-of-day duvar saati gibi okunur (UTC depolansa
    // da; tek-bölge MVP varsayımı, kod genelindeki kalıpla tutarlı).
    private static bool TouchesNightWindow(
        DateTime checkIn, DateTime checkOut, TimeOnly nightStart, TimeOnly nightEnd)
    {
        if (nightStart == nightEnd)
            return false;                                  // boş pencere → gece yok
        if (checkOut - checkIn >= TimeSpan.FromHours(24))
            return true;                                   // ≥24s vardiya pencereye kesin değer

        var firstDay = DateOnly.FromDateTime(checkIn);
        var lastDay = DateOnly.FromDateTime(checkOut);
        for (var day = firstDay; day <= lastDay; day = day.AddDays(1))
        {
            foreach (var (start, end) in NightIntervals(day, nightStart, nightEnd))
                if (checkIn < end && start < checkOut)     // [in,out) ∩ [start,end) ≠ ∅
                    return true;
        }
        return false;
    }

    // Verilen takvim günü için gece aralık(lar)ı. Sarma yoksa tek aralık; gece yarısını
    // sarıyorsa o günün AKŞAM ([start, ertesi 00:00)) ve SABAH ([00:00, end)) parçaları.
    private static IEnumerable<(DateTime start, DateTime end)> NightIntervals(
        DateOnly day, TimeOnly nightStart, TimeOnly nightEnd)
    {
        var dayStart = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        if (nightStart < nightEnd)
        {
            yield return (dayStart.Add(nightStart.ToTimeSpan()), dayStart.Add(nightEnd.ToTimeSpan()));
        }
        else
        {
            yield return (dayStart.Add(nightStart.ToTimeSpan()), dayStart.AddDays(1)); // akşam
            yield return (dayStart, dayStart.Add(nightEnd.ToTimeSpan()));              // sabah
        }
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