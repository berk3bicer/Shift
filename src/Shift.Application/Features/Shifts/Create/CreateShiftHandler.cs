using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Application.Features.Shifts.Create;

public class CreateShiftHandler : IRequestHandler<CreateShiftCommand, CreateShiftResult>
{
    private readonly IShiftDbContext _db;

    // İş Kanunu: iki vardiya arası en az bu kadar dinlenme olmalı (saat).
    private const double MinRestHours = 11;

    public CreateShiftHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CreateShiftResult> Handle(CreateShiftCommand request, CancellationToken ct)
    {
        // ── FK güvenliği: gönderilen ID'ler GERÇEKTEN bu tenant'a ait mi? ──
        // Global query filter sayesinde bu sorgular sadece bu tenant'ın
        // kayıtlarını görür → "var mı?" sorusu otomatik "bu tenant'ta var mı?" olur.

        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        var positionExists = await _db.Positions.AnyAsync(p => p.Id == request.PositionId, ct);
        if (!positionExists)
            throw new InvalidOperationException("Pozisyon bulunamadı.");

        // UserId verildiyse (açık vardiya değilse) o kullanıcı bu tenant'ta var mı?
        if (request.UserId.HasValue)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId.Value, ct);
            if (!userExists)
                throw new InvalidOperationException("Atanacak personel bulunamadı.");
        }

        // İş kuralı kontrollerinin biriktiği uyarı listesi.
        // Çakışma HATA (aşağıda throw); İş Kanunu limitleri UYARI (bu listeye eklenir).
        var warnings = new List<string>();

        // ── İş kuralı kontrolleri yalnızca personel ATANMIŞSA çalışır ──
        // Açık vardiyanın (UserId=null) sahibi yok → çakışma/limit hesabı tanımsız.
        if (request.UserId.HasValue)
        {
            // ── Çakışma kontrolü (HARD BLOCK) ──
            // Aynı personel aynı anda iki yerde olamaz → fiziksel imkânsızlık.
            // Kesişim kuralı (ListShifts ile aynı): mevcut.Start < yeni.End && mevcut.End > yeni.Start.
            // Sırt sırta vardiyalar (13:00 biten + 13:00 başlayan) bu kurala TAKILMAZ → meşru.
            var hasConflict = await _db.Shifts.AnyAsync(s =>
                s.UserId == request.UserId.Value
                && s.StartTime < request.EndTime
                && s.EndTime > request.StartTime, ct);

            if (hasConflict)
                throw new InvalidOperationException(
                    "Bu personelin bu saat aralığında zaten bir vardiyası var (çakışma).");

            var newShiftHours = (request.EndTime - request.StartTime).TotalHours;

            // ── [TR] Günlük 11 saat limiti (UYARI) ──
            // İş Kanunu: bir günde en fazla 11 saat çalışılabilir.
            // "Gün" = yeni vardiyanın başladığı takvim günü (UTC). O güne düşen
            // mevcut vardiyaların toplamı + yeni vardiya > 11 saat ise uyar (engelleme).
            var dayStart = request.StartTime.Date;          // o günün 00:00'ı
            var dayEnd = dayStart.AddDays(1);               // ertesi günün 00:00'ı

            // O personelin, o gün BAŞLAYAN mevcut vardiyalarının toplam süresi (saat).
            // DB tarafında toplama yapamayız (EF, TimeSpan.TotalHours çeviremez),
            // o yüzden gereken iki alanı çekip belleğe alıyoruz, toplamı C#'ta yapıyoruz.
            var sameDayShifts = await _db.Shifts
                .Where(s => s.UserId == request.UserId.Value
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
            // İş Kanunu: haftalık normal çalışma en fazla 45 saat; üzeri fazla mesai.
            // "Hafta" = Pazartesi 00:00 → gelecek Pazartesi 00:00 (deterministik hesap).
            // Verilen günden en yakın geçmiş Pazartesi'ye kaç gün geri gidilir:
            //   Pazar=0, Pazartesi=1 ... → ((int)gün - 1 + 7) % 7
            var daysSinceMonday = ((int)request.StartTime.DayOfWeek - 1 + 7) % 7;
            var weekStart = request.StartTime.Date.AddDays(-daysSinceMonday); // o haftanın Pazartesi 00:00
            var weekEnd = weekStart.AddDays(7);                                // gelecek Pazartesi 00:00

            var sameWeekShifts = await _db.Shifts
                .Where(s => s.UserId == request.UserId.Value
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
            // İş Kanunu: ardışık iki vardiya arasında en az 11 saat dinlenme olmalı.
            // Yalnızca FARKLI günlerdeki komşulara bakarız — aynı gün içindeki ardışık
            // vardiyalar (09-13, 13-17) "split shift"tir, zaten günlük 11s kuralıyla denetlenir.

            // Önceki komşu: yeni vardiyadan ÖNCE biten en son vardiya.
            var prev = await _db.Shifts
                .Where(s => s.UserId == request.UserId.Value
                         && s.EndTime <= request.StartTime)
                .OrderByDescending(s => s.EndTime)
                .Select(s => new { s.StartTime, s.EndTime })
                .FirstOrDefaultAsync(ct);

            if (prev != null && prev.StartTime.Date != request.StartTime.Date)
            {
                var restBefore = (request.StartTime - prev.EndTime).TotalHours;
                if (restBefore < MinRestHours)
                    warnings.Add($"Yetersiz dinlenme: önceki vardiya ile arada yalnızca {restBefore:0.#} saat var (en az {MinRestHours:0.#} saat önerilir).");
            }

            // Sonraki komşu: yeni vardiyadan SONRA başlayan en erken vardiya.
            var next = await _db.Shifts
                .Where(s => s.UserId == request.UserId.Value
                         && s.StartTime >= request.EndTime)
                .OrderBy(s => s.StartTime)
                .Select(s => new { s.StartTime, s.EndTime })
                .FirstOrDefaultAsync(ct);

            if (next != null && next.StartTime.Date != request.StartTime.Date)
            {
                var restAfter = (next.StartTime - request.EndTime).TotalHours;
                if (restAfter < MinRestHours)
                    warnings.Add($"Yetersiz dinlenme: sonraki vardiya ile arada yalnızca {restAfter:0.#} saat var (en az {MinRestHours:0.#} saat önerilir).");
            }
        }

        var shift = new ShiftEntity
        {
            // TenantId YOK — SaveChanges interceptor otomatik damgalar
            BranchId = request.BranchId,
            PositionId = request.PositionId,
            UserId = request.UserId,                    // null olabilir → açık vardiya
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Notes = request.Notes,
            Status = Shift.Domain.Entities.ShiftStatus.Draft  // taslak doğar
        };

        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync(ct);

        return new CreateShiftResult(shift.Id, warnings);
    }
}