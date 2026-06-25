using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Attachments.Confirm;

// Yükleme tamamlandıktan sonra çağrılır: object key'i kalıcı Attachment kaydına bağlar.
public record ConfirmAttachmentCommand(
    AttachmentOwnerType OwnerType,
    Guid OwnerId,
    string StorageKey,
    string? ContentType,
    string? FileName
) : IRequest<ConfirmAttachmentResult>;

public record ConfirmAttachmentResult(Guid AttachmentId);
