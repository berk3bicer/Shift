using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.ChecklistRuns.List;

public class ListChecklistRunsHandler
    : IRequestHandler<ListChecklistRunsQuery, IReadOnlyList<ChecklistRunSummaryDto>>
{
    private readonly IShiftDbContext _db;

    public ListChecklistRunsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ChecklistRunSummaryDto>> Handle(
        ListChecklistRunsQuery request, CancellationToken ct)
    {
        var query = _db.ChecklistRuns.Where(r => r.BranchId == request.BranchId);

        if (request.Type is { } type)
            query = query.Where(r => (int)r.Type == type);
        if (request.FromDate is { } from)
            query = query.Where(r => r.RunDate >= from);
        if (request.ToDate is { } to)
            query = query.Where(r => r.RunDate <= to);

        return await query
            .OrderByDescending(r => r.RunDate).ThenBy(r => r.Type)
            .Select(r => new ChecklistRunSummaryDto(
                r.Id,
                r.ChecklistName,
                (int)r.Type,
                r.RunDate,
                r.CompletedAt,
                r.Items.Count(i => i.IsChecked),
                r.Items.Count))
            .ToListAsync(ct);
    }
}
