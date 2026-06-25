using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Attachments.List;

// Bir sahibin (görev / checklist madde) iliştirmelerini, her biri için indirme URL'iyle getirir.
public record ListAttachmentsQuery(
    AttachmentOwnerType OwnerType,
    Guid OwnerId
) : IRequest<IReadOnlyList<AttachmentDto>>;

public record AttachmentDto(
    Guid Id,
    string StorageKey,
    string? ContentType,
    string? FileName,
    Guid? UploadedByUserId,
    string? UploadedByUserName,
    DateTime CreatedAt,
    string DownloadUrl       // presigned GET (süreli)
);
