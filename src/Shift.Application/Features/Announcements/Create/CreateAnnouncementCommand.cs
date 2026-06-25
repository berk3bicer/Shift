using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Announcements.Create;

// Duyuru yayınlar ve hedef kullanıcılara bildirim fan-out'u yapar.
// BranchId null = tüm şubeler; TargetRole null = tüm ekip. İkisi de null = herkese.
public record CreateAnnouncementCommand(
    string Title,
    string Body,
    Guid? BranchId,
    RoleType? TargetRole
) : IRequest<CreateAnnouncementResult>;

// RecipientCount: kaç kişiye bildirim gitti (gönderen hariç) — yöneticiye geri bildirim.
public record CreateAnnouncementResult(Guid AnnouncementId, int RecipientCount);
