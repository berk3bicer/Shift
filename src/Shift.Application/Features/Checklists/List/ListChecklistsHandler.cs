using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Checklists.List;

public class ListChecklistsHandler
    : IRequestHandler<ListChecklistsQuery, IReadOnlyList<ChecklistDto>>
{
    private readonly IShiftDbContext _db;

    public ListChecklistsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ChecklistDto>> Handle(
        ListChecklistsQuery request, CancellationToken ct)
    {
        // Tenant filtresi otomatik (hem şablon hem madde).
        var query = _db.Checklists.AsQueryable();

        if (request.Type is { } type)
            query = query.Where(c => (int)c.Type == type);

        if (!request.IncludeInactive)
            query = query.Where(c => c.IsActive);

        return await query
            .OrderBy(c => c.Type).ThenBy(c => c.Name)
            .Select(c => new ChecklistDto(
                c.Id,
                (int)c.Type,
                c.Name,
                c.IsActive,
                c.Items
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new ChecklistItemDto(i.Id, i.Text, i.SortOrder))
                    .ToList()))
            .ToListAsync(ct);
    }
}
