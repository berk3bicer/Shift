using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Announcements.List;

// Duyuruları listeler (yönetim görünümü). Şube/rol hedefine göre opsiyonel daraltma.
// Yeni → eski. (Personel duyuruları bildirim inbox'undan görür; bu yönetim listesi.)
public record ListAnnouncementsQuery(
    Guid? BranchId,
    int? TargetRole
) : IRequest<IReadOnlyList<AnnouncementDto>>;

public record AnnouncementDto(
    Guid Id,
    string Title,
    string Body,
    Guid? BranchId,
    int? TargetRole,
    Guid? CreatedByUserId,
    string? CreatedByUserName,
    DateTime CreatedAt
);
