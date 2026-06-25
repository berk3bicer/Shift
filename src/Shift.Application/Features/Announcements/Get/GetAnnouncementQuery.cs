using MediatR;
using Shift.Application.Features.Announcements.List;

namespace Shift.Application.Features.Announcements.Get;

// Tek duyuru (bildirimden tıklayınca açılır). DTO List ile aynı — tek satır.
public record GetAnnouncementQuery(Guid Id) : IRequest<AnnouncementDto?>;
