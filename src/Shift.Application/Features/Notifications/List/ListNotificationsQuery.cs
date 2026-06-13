using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Notifications.List;

// Login olan kullanıcının bildirimleri. UserId token'dan — parametre yok.
public record ListNotificationsQuery() : IRequest<IReadOnlyList<NotificationListItem>>;

public record NotificationListItem(
    Guid Id,
    NotificationType Type,
    string Message,
    Guid? RelatedEntityId,
    bool IsRead,
    DateTime CreatedAt
);