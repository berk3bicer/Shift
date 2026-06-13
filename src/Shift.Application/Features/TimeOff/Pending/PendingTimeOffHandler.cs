using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.TimeOff.List;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.Pending;

public class PendingTimeOffHandler
    : IRequestHandler<PendingTimeOffQuery, IReadOnlyList<TimeOffListItem>>
{
    private readonly IShiftDbContext _db;

    public PendingTimeOffHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TimeOffListItem>> Handle(
        PendingTimeOffQuery request, CancellationToken ct)
    {
        // Tüm personelin bekleyen talepleri. Onay kuyruğu mantığı:
        // en eski talep en üstte (FIFO) → bekleyen en uzun süredir önce işlensin.
        var items = await _db.TimeOffRequests
            .Where(t => t.Status == TimeOffStatus.Pending)
            .OrderBy(t => t.CreatedAt)
            .Select(t => new TimeOffListItem(
                t.Id,
                t.UserId,
                t.User.FullName,
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