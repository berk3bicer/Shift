using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Common.Services;

// Vardiya iş kurallarının tek kaynağı. Create ve Update bunu kullanır.
// Tüm sorgular global query filter altında → otomatik tenant izolasyonu.
public class ShiftRuleChecker : IShiftRuleChecker
{
    private readonly IShiftDbContext _db;

    // İş Kanunu: iki vardiya arası en az bu kadar dinlenme olmalı (saat).
    private const double MinRestHours = 11;

    public ShiftRuleChecker(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<string>> CheckAsync(
        Guid? userId,
        DateTime startTime,
        DateTime endTime,
        Guid? excludeShiftId,
        CancellationToken ct)
    {
        var warnings = new List<string>();

        // ── İş kuralı kontrolleri yalnızca personel ATANMIŞSA çalışır ──
        // Açık vardiyanın (UserId=null) sahibi yok → çakışma/limit hesabı tanımsız.
        if (!userId.HasValue)
            return warnings;

        var uid = userId.Value;

        // ── Çakışma kontrolü (HARD BLOCK) ──
        // Aynı personel aynı anda iki yerde olamaz → fiziksel imkânsızlık.
        // Kesişim kuralı: mevcut.Start < yeni.End && mevcut.End > yeni.Start.
        // Sırt sırta vardiyalar (13:00 biten + 13:00 başlayan) TAKILMAZ → meşru.
        // excludeShiftId: Update'te vardiyanın kendisi bu kontrole girmemeli.
        var hasConflict = await _db.Shifts.AnyAsync(s =>
            s.UserId == uid
            && (excludeShiftId == null || s.Id != excludeShiftId)
            && s.StartTime < endTime
            && s.EndTime > startTime, ct);

        if (hasConflict)
            throw new InvalidOperationException(
                "Bu personelin bu saat aralığında zaten bir vardiyası var (çakışma).");

        var newShiftHours = (endTime - startTime).TotalHours;

        // ── [TR] Günlük 11 saat limiti (UYARI) ──
        // "Gün" = yeni vardiyanın başladığı takvim günü (UTC). O güne düşen
        // mevcut vardiyaların toplamı + yeni vardiya > 11 saat ise uyar (engelleme).
        var dayStart = startTime.Date;          // o günün 00:00'ı
        var dayEnd = dayStart.AddDays(1);       // ertesi günün 00:00'ı

        // DB tarafında toplama yapamayız (EF, TimeSpan.TotalHours çeviremez),
        // o yüzden gereken iki alanı çekip belleğe alıyoruz, toplamı C#'ta yapıyoruz.
        var sameDayShifts = await _db.Shifts
            .Where(s => s.UserId == uid
                     && (excludeShiftId == null || s.Id != excludeShiftId)
                     && s.StartTime >= dayStart
                     && s.StartTime < dayEnd)
            .Select(s => new { s.StartTime, s.EndTime })
            .ToListAsync(ct);

        var existingDayHours = sameDayShifts.Sum(s => (s.EndTime - s.StartTime).TotalHours);
        var totalDayHours = existingDayHours + newShiftHours;

        if (totalDayHours > 11)
            warnings.Add(
                $"Günlük 11 saat limiti aşılıyor: bu personelin {dayStart:dd.MM.yyyy} " +
                $"günü toplam çalışma süresi {totalDayHours:0.#} saat olacak.");

        // ── [TR] Haftalık 45 saat limiti (UYARI) ──
        // "Hafta" = Pazartesi 00:00 → gelecek Pazartesi 00:00 (deterministik hesap).
        // Pazar=0, Pazartesi=1 ... → geri gidilecek gün: ((int)gün - 1 + 7) % 7
        var daysSinceMonday = ((int)startTime.DayOfWeek - 1 + 7) % 7;
        var weekStart = startTime.Date.AddDays(-daysSinceMonday); // o haftanın Pazartesi 00:00
        var weekEnd = weekStart.AddDays(7);                        // gelecek Pazartesi 00:00

        var sameWeekShifts = await _db.Shifts
            .Where(s => s.UserId == uid
                     && (excludeShiftId == null || s.Id != excludeShiftId)
                     && s.StartTime >= weekStart
                     && s.StartTime < weekEnd)
            .Select(s => new { s.StartTime, s.EndTime })
            .ToListAsync(ct);

        var existingWeekHours = sameWeekShifts.Sum(s => (s.EndTime - s.StartTime).TotalHours);
        var totalWeekHours = existingWeekHours + newShiftHours;

        if (totalWeekHours > 45)
            warnings.Add(
                $"Haftalık 45 saat limiti aşılıyor: bu personelin " +
                $"{weekStart:dd.MM.yyyy} haftası toplam çalışma süresi " +
                $"{totalWeekHours:0.#} saat olacak (fazla mesai).");

        // ── [TR] İki vardiya arası minimum dinlenme (UYARI) ──
        // Ardışık iki vardiya arasında en az 11 saat dinlenme olmalı.
        // Yalnızca FARKLI günlerdeki komşulara bakarız — aynı gün ardışıkları (09-13, 13-17)
        // "split shift"tir, zaten günlük 11s kuralıyla denetlenir.

        // Önceki komşu: yeni vardiyadan ÖNCE biten en son vardiya.
        var prev = await _db.Shifts
            .Where(s => s.UserId == uid
                     && (excludeShiftId == null || s.Id != excludeShiftId)
                     && s.EndTime <= startTime)
            .OrderByDescending(s => s.EndTime)
            .Select(s => new { s.StartTime, s.EndTime })
            .FirstOrDefaultAsync(ct);

        if (prev != null && prev.StartTime.Date != startTime.Date)
        {
            var restBefore = (startTime - prev.EndTime).TotalHours;
            if (restBefore < MinRestHours)
                warnings.Add($"Yetersiz dinlenme: önceki vardiya ile arada yalnızca {restBefore:0.#} saat var (en az {MinRestHours:0.#} saat önerilir).");
        }

        // Sonraki komşu: yeni vardiyadan SONRA başlayan en erken vardiya.
        var next = await _db.Shifts
            .Where(s => s.UserId == uid
                     && (excludeShiftId == null || s.Id != excludeShiftId)
                     && s.StartTime >= endTime)
            .OrderBy(s => s.StartTime)
            .Select(s => new { s.StartTime, s.EndTime })
            .FirstOrDefaultAsync(ct);

        if (next != null && next.StartTime.Date != startTime.Date)
        {
            var restAfter = (next.StartTime - endTime).TotalHours;
            if (restAfter < MinRestHours)
                warnings.Add($"Yetersiz dinlenme: sonraki vardiya ile arada yalnızca {restAfter:0.#} saat var (en az {MinRestHours:0.#} saat önerilir).");
        }

        // ── Müsaitlik kontrolü (UYARI) ──
        // Personelin, vardiyanın düştüğü GÜNE ait "müsait değil" kayıtları var mı?
        // Vardiyanın saat aralığı, müsaitsizlik aralığıyla çakışıyorsa uyar.
        // Engellemiyoruz: yönetici acil durumda yine de atayabilmeli (7shifts modeli).
        var shiftDay = startTime.DayOfWeek;                    // vardiyanın haftalık günü
        var shiftStartTod = TimeOnly.FromDateTime(startTime);  // sadece saat kısmı
        var shiftEndTod = TimeOnly.FromDateTime(endTime);

        var dayUnavailabilities = await _db.Availabilities
            .Where(a => a.UserId == uid && a.DayOfWeek == shiftDay)
            .Select(a => new { a.StartTime, a.EndTime, a.Reason })
            .ToListAsync(ct);

        foreach (var ua in dayUnavailabilities)
        {
            // Saat aralığı kesişimi: ua.Start < shiftEnd && ua.End > shiftStart.
            if (ua.StartTime < shiftEndTod && ua.EndTime > shiftStartTod)
            {
                var reasonText = string.IsNullOrWhiteSpace(ua.Reason) ? "" : $" (sebep: {ua.Reason})";
                warnings.Add(
                    $"Personel bu saatte müsait değil: {ua.StartTime:HH\\:mm}–{ua.EndTime:HH\\:mm}{reasonText}.");
            }
        }

        // ── Onaylı izin kontrolü (UYARI) ──
        // Personelin, vardiyanın düştüğü GÜNE denk gelen ONAYLI (Approved) izni var mı?
        // İzin gün-bazlı: StartDate <= vardiyaGünü <= EndDate ise o gün izinli.
        // Sadece Approved'a bakarız: Pending henüz taahhüt değil, Rejected geçersiz.
        // Engellemiyoruz — yönetici override edebilir (7shifts modeli).
        var shiftDate = DateOnly.FromDateTime(startTime);

        var approvedLeaves = await _db.TimeOffRequests
            .Where(t => t.UserId == uid
                     && t.Status == TimeOffStatus.Approved
                     && t.StartDate <= shiftDate
                     && t.EndDate >= shiftDate)
            .Select(t => new { t.StartDate, t.EndDate, t.Type })
            .ToListAsync(ct);

        foreach (var leave in approvedLeaves)
        {
            warnings.Add(
                $"Personel bu tarihte onaylı izinde: {leave.StartDate:dd.MM.yyyy}–{leave.EndDate:dd.MM.yyyy} " +
                $"({leave.Type} izni).");
        }

        return warnings;
    }
}