using MediatR;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Attachments.Confirm;

public class ConfirmAttachmentHandler
    : IRequestHandler<ConfirmAttachmentCommand, ConfirmAttachmentResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public ConfirmAttachmentHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ConfirmAttachmentResult> Handle(
        ConfirmAttachmentCommand request, CancellationToken ct)
    {
        // Sahip kayıt bu tenant'ta var mı?
        if (!await AttachmentOwner.ExistsAsync(_db, request.OwnerType, request.OwnerId, ct))
            throw new InvalidOperationException("İliştirilecek kayıt bulunamadı.");

        // Key gerçekten BU sahip için mi üretilmiş? (başka sahibin/uydurma key'i geçilemesin)
        var prefix = AttachmentOwner.KeyPrefix(request.OwnerType, request.OwnerId);
        if (!request.StorageKey.StartsWith(prefix, StringComparison.Ordinal))
            throw new InvalidOperationException("Object key bu kayda ait değil.");

        var attachment = new Attachment
        {
            // TenantId YOK — interceptor damgalar.
            OwnerType = request.OwnerType,
            OwnerId = request.OwnerId,
            StorageKey = request.StorageKey,
            ContentType = request.ContentType,
            FileName = request.FileName,
            UploadedByUserId = _currentUser.GetUserId()   // kim yükledi — token'dan
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync(ct);

        return new ConfirmAttachmentResult(attachment.Id);
    }
}
