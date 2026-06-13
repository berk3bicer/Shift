using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Shifts.PublishShift;

public class PublishShiftHandler
    : IRequestHandler<PublishShiftCommand, PublishShiftResult>
{
    private readonly IShiftDbContext _db;

    public PublishShiftHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<PublishShiftResult> Handle(
        PublishShiftCommand request, CancellationToken ct)
    {
        // Global filter → yalnızca kendi tenant'ımızın vardiyası bulunur.
        var shift = await _db.Shifts
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct);

        if (shift is null)
            throw new InvalidOperationException("Vardiya bulunamadı.");

        // ── STATE MACHINE ──
        // Yalnızca Draft yayınlanabilir. Zaten Published ise tekrar yayınlanamaz.
        if (shift.Status != ShiftStatus.Draft)
            throw new InvalidOperationException(
                $"Bu vardiya zaten yayında (durum: {shift.Status}). " +
                "Yalnızca taslak vardiyalar yayınlanabilir.");

        shift.Status = ShiftStatus.Published;
        shift.UpdatedAt = DateTime.UtcNow;

        // Atanmış personele bildirim. Açık vardiya (UserId null) → bildirim yok.
        // Durum değişikliği + bildirim aynı SaveChanges'te → atomik.
        if (shift.UserId.HasValue)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = shift.UserId.Value,
                Type = NotificationType.ShiftPublished,
                Message = "Bir vardiyanız yayınlandı.",
                RelatedEntityId = shift.Id,   // hangi vardiya
                IsRead = false
            });
        }

        await _db.SaveChangesAsync(ct);

        return new PublishShiftResult(shift.Id, shift.Status.ToString());
    }
}