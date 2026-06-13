using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.TimeOff.List;

public class ListTimeOffHandler
    : IRequestHandler<ListTimeOffQuery, IReadOnlyList<TimeOffListItem>>
{
    private readonly IShiftDbContext _db;

    public ListTimeOffHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TimeOffListItem>> Handle(
        ListTimeOffQuery request, CancellationToken ct)
    {
        // Global query filter zaten tenant izolasyonunu sağlıyor —
        // başka tenant'ın talepleri sorguya hiç girmez.
        var items = await _db.TimeOffRequests
            .Where(t => t.UserId == request.UserId)
            .OrderByDescending(t => t.StartDate)
            .Select(t => new TimeOffListItem(
                t.Id,
                t.UserId,
                t.StartDate,
                t.EndDate,
                t.Type,
                t.Reason,
                t.Status,
                t.DecidedByUserId,
                t.DecisionNote,
                t.CreatedAt))
            .ToListAsync(ct);

        return items;
    }
}