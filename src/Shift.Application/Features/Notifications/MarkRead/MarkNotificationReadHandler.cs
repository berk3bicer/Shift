using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Notifications.MarkRead;

public class MarkNotificationReadHandler
    : IRequestHandler<MarkNotificationReadCommand, MarkNotificationReadResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public MarkNotificationReadHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MarkNotificationReadResult> Handle(
        MarkNotificationReadCommand request, CancellationToken ct)
    {
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.Id, ct);

        if (notification is null)
            throw new InvalidOperationException("Bildirim bulunamadı.");

        // ── IDOR koruması ──
        // Kullanıcı SADECE kendi bildirimini okundu işaretleyebilir.
        // Global filter tenant izolasyonu sağlar ama aynı tenant içinde
        // başka personelin bildirimine erişimi burada engelliyoruz.
        if (notification.UserId != userId.Value)
            throw new UnauthorizedAccessException("Bu bildirim size ait değil.");

        // Idempotent: zaten okunmuşsa sorun değil, tekrar true yazılır.
        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new MarkNotificationReadResult(notification.Id, notification.IsRead);
    }
}