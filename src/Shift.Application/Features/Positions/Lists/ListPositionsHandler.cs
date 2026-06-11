using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Positions.List;

public class ListPositionsHandler : IRequestHandler<ListPositionsQuery, IReadOnlyList<PositionDto>>
{
    private readonly IShiftDbContext _db;

    public ListPositionsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PositionDto>> Handle(ListPositionsQuery request, CancellationToken ct)
    {
        return await _db.Positions
            .OrderBy(p => p.Name)
            .Select(p => new PositionDto(
                p.Id, p.Name, p.ColorCode, p.HourlyRate, p.IsActive))
            .ToListAsync(ct);
    }
}