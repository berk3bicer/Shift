using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.ChecklistRuns.Get;

public class GetChecklistRunHandler
    : IRequestHandler<GetChecklistRunQuery, ChecklistRunDto?>
{
    private readonly IShiftDbContext _db;

    public GetChecklistRunHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<ChecklistRunDto?> Handle(GetChecklistRunQuery request, CancellationToken ct)
    {
        // İşaretleyen/başlatan/tamamlayan adlarını ada çözmek için Users'a join gerekiyor;
        // EF nullable navigation'lar (StartedByUser vb.) LEFT JOIN'e çevrilir.
        var run = await _db.ChecklistRuns
            .Where(r => r.Id == request.RunId)
            .Select(r => new ChecklistRunDto(
                r.Id,
                r.BranchId,
                r.ChecklistId,
                r.ChecklistName,
                (int)r.Type,
                r.RunDate,
                r.StartedByUserId,
                r.StartedByUser != null ? r.StartedByUser.FullName : null,
                r.CompletedAt,
                r.CompletedByUserId,
                r.CompletedByUser != null ? r.CompletedByUser.FullName : null,
                r.Items.Count(i => i.IsChecked),
                r.Items.Count,
                r.Items
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new ChecklistRunItemDto(
                        i.Id,
                        i.Text,
                        i.SortOrder,
                        i.IsChecked,
                        i.CheckedByUserId,
                        i.CheckedByUser != null ? i.CheckedByUser.FullName : null,
                        i.CheckedAt,
                        i.Note))
                    .ToList()))
            .FirstOrDefaultAsync(ct);

        return run;
    }
}
