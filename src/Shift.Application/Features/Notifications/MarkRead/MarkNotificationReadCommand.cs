using MediatR;

namespace Shift.Application.Features.Notifications.MarkRead;

// Bir bildirimi okundu işaretler. Id URL'den gelir.
public record MarkNotificationReadCommand(Guid Id) : IRequest<MarkNotificationReadResult>;

public record MarkNotificationReadResult(Guid Id, bool IsRead);