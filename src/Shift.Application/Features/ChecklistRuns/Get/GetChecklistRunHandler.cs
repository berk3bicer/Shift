using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ChecklistRuns.Get;

public class GetChecklistRunHandler
    : IRequestHandler<GetChecklistRunQuery, ChecklistRunDto?>
{
    private readonly IShiftDbContext _db;
    private readonly IFileStorage _storage;

    public GetChecklistRunHandler(IShiftDbContext db, IFileStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<ChecklistRunDto?> Handle(GetChecklistRunQuery request, CancellationToken ct)
    {
        // ── 1) Çalıştırma + maddeler (kim/ne zaman adlarıyla) ──
        // Nullable navigation'lar (StartedByUser vb.) LEFT JOIN'e çevrilir. Attachment'lar
        // burada DEĞİL — async presign gerektirir (2. adım), LINQ projeksiyonuna giremez.
        var run = await _db.ChecklistRuns
            .Where(r => r.Id == request.RunId)
            .Select(r => new
            {
                r.Id,
                r.BranchId,
                r.ChecklistId,
                r.ChecklistName,
                Type = (int)r.Type,
                r.RunDate,
                StartedAt = r.CreatedAt,                       // (D) başlatılma anı = CreatedAt
                r.StartedByUserId,
                StartedByUserName = r.StartedByUser != null ? r.StartedByUser.FullName : null,
                r.CompletedAt,
                r.CompletedByUserId,
                CompletedByUserName = r.CompletedByUser != null ? r.CompletedByUser.FullName : null,
                CheckedCount = r.Items.Count(i => i.IsChecked),
                TotalCount = r.Items.Count,
                Items = r.Items
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new
                    {
                        i.Id,
                        i.Text,
                        i.SortOrder,
                        i.IsChecked,
                        i.CheckedByUserId,
                        CheckedByUserName = i.CheckedByUser != null ? i.CheckedByUser.FullName : null,
                        i.CheckedAt,
                        i.Note
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (run is null) return null;

        // ── 2) Maddelerin kanıt fotoğrafları (polimorfik Attachment, tek IN sorgusu) ──
        // OwnerType=ChecklistRunItem + OwnerId ∈ bu run'ın madde id'leri. N+1 yok: hepsini
        // tek sorguyla çek, sonra her biri için presigned indirme URL'i üret.
        var itemIds = run.Items.Select(i => i.Id).ToList();

        var attachmentRows = await _db.Attachments
            .Where(a => a.OwnerType == AttachmentOwnerType.ChecklistRunItem
                     && itemIds.Contains(a.OwnerId))
            .OrderBy(a => a.CreatedAt)
            .Select(a => new { a.Id, a.OwnerId, a.FileName, a.ContentType, a.StorageKey })
            .ToListAsync(ct);

        var attachmentsByItem = new Dictionary<Guid, List<ChecklistItemAttachmentDto>>();
        foreach (var a in attachmentRows)
        {
            var url = await _storage.CreateDownloadUrlAsync(a.StorageKey, ct);
            if (!attachmentsByItem.TryGetValue(a.OwnerId, out var list))
            {
                list = new List<ChecklistItemAttachmentDto>();
                attachmentsByItem[a.OwnerId] = list;
            }
            list.Add(new ChecklistItemAttachmentDto(a.Id, a.FileName, a.ContentType, url));
        }

        // ── 3) DTO'yu birleştir ──
        return new ChecklistRunDto(
            run.Id,
            run.BranchId,
            run.ChecklistId,
            run.ChecklistName,
            run.Type,
            run.RunDate,
            run.StartedAt,
            run.StartedByUserId,
            run.StartedByUserName,
            run.CompletedAt,
            run.CompletedByUserId,
            run.CompletedByUserName,
            run.CheckedCount,
            run.TotalCount,
            run.Items.Select(i => new ChecklistRunItemDto(
                i.Id,
                i.Text,
                i.SortOrder,
                i.IsChecked,
                i.CheckedByUserId,
                i.CheckedByUserName,
                i.CheckedAt,
                i.Note,
                attachmentsByItem.TryGetValue(i.Id, out var atts)
                    ? atts
                    : new List<ChecklistItemAttachmentDto>()))
                .ToList());
    }
}
