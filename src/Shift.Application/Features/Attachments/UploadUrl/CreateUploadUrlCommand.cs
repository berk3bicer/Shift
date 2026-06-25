using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Attachments.UploadUrl;

// Presigned yükleme URL'i ister. DB'ye YAZMAZ (stateless): client bu URL'e dosyayı
// doğrudan yükler, sonra Confirm ile key'i kaydettirir. Owner doğrulanır.
public record CreateUploadUrlCommand(
    AttachmentOwnerType OwnerType,
    Guid OwnerId,
    string ContentType,
    string? FileName
) : IRequest<CreateUploadUrlResult>;

// Key: client'ın Confirm'de geri göndereceği object anahtarı. Url: doğrudan PUT hedefi.
public record CreateUploadUrlResult(string Key, string UploadUrl, string Method);
