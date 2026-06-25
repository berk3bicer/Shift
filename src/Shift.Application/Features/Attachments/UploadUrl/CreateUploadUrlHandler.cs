using MediatR;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Attachments.UploadUrl;

public class CreateUploadUrlHandler
    : IRequestHandler<CreateUploadUrlCommand, CreateUploadUrlResult>
{
    private readonly IShiftDbContext _db;
    private readonly IFileStorage _storage;

    public CreateUploadUrlHandler(IShiftDbContext db, IFileStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<CreateUploadUrlResult> Handle(
        CreateUploadUrlCommand request, CancellationToken ct)
    {
        // Sahip kayıt bu tenant'ta var mı? (yoksa boş yükleme URL'i üretme)
        if (!await AttachmentOwner.ExistsAsync(_db, request.OwnerType, request.OwnerId, ct))
            throw new InvalidOperationException("İliştirilecek kayıt bulunamadı.");

        // Object key: sahip prefiksi + benzersiz ad + uzantı. Prefiks, Confirm'de
        // key'in doğru sahibe ait olduğunu doğrulamayı sağlar.
        var ext = string.IsNullOrWhiteSpace(request.FileName)
            ? ""
            : Path.GetExtension(request.FileName);
        var key = AttachmentOwner.KeyPrefix(request.OwnerType, request.OwnerId)
                + $"{Guid.NewGuid():N}{ext}";

        var target = await _storage.CreateUploadUrlAsync(key, request.ContentType, ct);

        return new CreateUploadUrlResult(key, target.Url, target.Method);
    }
}
