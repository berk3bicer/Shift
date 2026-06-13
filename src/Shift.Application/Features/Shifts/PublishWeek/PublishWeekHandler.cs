using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Shifts.PublishWeek;

public class PublishWeekHandler
    : IRequestHandler<PublishWeekCommand, PublishWeekResult>
{
    private readonly IShiftDbContext _db;

    public PublishWeekHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<PublishWeekResult> Handle(
        PublishWeekCommand request, CancellationToken ct)
    {
        // FK güvenliği: şube bu tenant'ta var mı? (global filter altında)
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        // İlgili aralıktaki DRAFT vardiyaları çek. Başlangıcı aralığa düşenler.
        // Global filter zaten tenant izolasyonunu sağlıyor.
        var draftShifts = await _db.Shifts
            .Where(s => s.BranchId == request.BranchId
                     && s.Status == ShiftStatus.Draft
                     && s.StartTime >= request.RangeStart
                     && s.StartTime < request.RangeEnd)
            .ToListAsync(ct);

        if (draftShifts.Count == 0)
            return new PublishWeekResult(0, 0);

        // ── Hepsini Published'a geçir ──
        var now = DateTime.UtcNow;
        foreach (var shift in draftShifts)
        {
            shift.Status = ShiftStatus.Published;
            shift.UpdatedAt = now;
        }

        // ── Etkilenen personeli bul (atanmış olanlar; açık vardiyalar hariç) ──
        // Bir personel haftada birden çok vardiyaya sahip olabilir → Distinct.
        // Her personele TEK özet bildirim (her vardiya için ayrı değil — spam olmasın).
        var affectedUserIds = draftShifts
            .Where(s => s.UserId.HasValue)
            .Select(s => s.UserId!.Value)
            .Distinct()
            .ToList();

        foreach (var userId in affectedUserIds)
        {
            _db.Notifications.Add(new Notification
            {
                // TenantId YOK — interceptor damgalar.
                UserId = userId,
                Type = NotificationType.ShiftPublished,
                Message = "Haftalık vardiya programınız yayınlandı.",
                RelatedEntityId = request.BranchId,  // hangi şube → frontend yönlendirir
                IsRead = false
            });
        }

        // Vardiya durumları + bildirimler AYNI transaction'da → atomik.
        // Ya hepsi yayınlanır + bildirimler gider, ya hiçbiri (hata olursa rollback).
        await _db.SaveChangesAsync(ct);

        return new PublishWeekResult(draftShifts.Count, affectedUserIds.Count);
    }
}