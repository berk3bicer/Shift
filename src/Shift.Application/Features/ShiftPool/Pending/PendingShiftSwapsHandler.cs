using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPool.Pending;

public class PendingShiftSwapsHandler
    : IRequestHandler<PendingShiftSwapsQuery, IReadOnlyList<PendingShiftSwapDto>>
{
    private readonly IShiftDbContext _db;

    public PendingShiftSwapsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PendingShiftSwapDto>> Handle(
        PendingShiftSwapsQuery request, CancellationToken ct)
    {
        // En eski talep en üstte (FIFO) — PendingTimeOffHandler ile aynı desen.
        var items = await _db.ShiftSwaps
            .Where(s => s.Status == SwapStatus.Pending)
            .OrderBy(s => s.CreatedAt)
            .Select(s => new PendingShiftSwapDto(
                s.Id,
                (int)s.Type,
                s.ShiftId,
                s.Shift.BranchId,
                s.Shift.Branch.Name,
                s.Shift.PositionId,
                s.Shift.Position.Name,
                s.Shift.StartTime,
                s.Shift.EndTime,
                s.RequestedByUserId,
                s.RequestedByUser.FullName,
                s.CreatedAt))
            .ToListAsync(ct);

        return items;
    }
}
