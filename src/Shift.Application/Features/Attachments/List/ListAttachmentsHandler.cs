using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Attachments.List;

public class ListAttachmentsHandler
    : IRequestHandler<ListAttachmentsQuery, IReadOnlyList<AttachmentDto>>
{
    private readonly IShiftDbContext _db;
    private readonly IFileStorage _storage;

    public ListAttachmentsHandler(IShiftDbContext db, IFileStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<IReadOnlyList<AttachmentDto>> Handle(
        ListAttachmentsQuery request, CancellationToken ct)
    {
        // Önce kayıtları çek (tenant filtreli), sonra her biri için presigned indirme URL'i üret.
        var rows = await _db.Attachments
            .Where(a => a.OwnerType == request.OwnerType && a.OwnerId == request.OwnerId)
            .OrderBy(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.StorageKey,
                a.ContentType,
                a.FileName,
                a.UploadedByUserId,
                UploaderName = a.UploadedByUser != null ? a.UploadedByUser.FullName : null,
                a.CreatedAt
            })
            .ToListAsync(ct);

        var result = new List<AttachmentDto>(rows.Count);
        foreach (var r in rows)
        {
            var url = await _storage.CreateDownloadUrlAsync(r.StorageKey, ct);
            result.Add(new AttachmentDto(
                r.Id, r.StorageKey, r.ContentType, r.FileName,
                r.UploadedByUserId, r.UploaderName, r.CreatedAt, url));
        }

        return result;
    }
}
