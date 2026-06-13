using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Notifications.List;

public class ListNotificationsHandler
    : IRequestHandler<ListNotificationsQuery, IReadOnlyList<NotificationListItem>>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public ListNotificationsHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<NotificationListItem>> Handle(
        ListNotificationsQuery request, CancellationToken ct)
    {
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // En yeni bildirim en üstte (inbox mantığı).
        var items = await _db.Notifications
            .Where(n => n.UserId == userId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationListItem(
                n.Id,
                n.Type,
                n.Message,
                n.RelatedEntityId,
                n.IsRead,
                n.CreatedAt))
            .ToListAsync(ct);

        return items;
    }
}