using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Availabilities.List;

public class ListAvailabilitiesHandler
    : IRequestHandler<ListAvailabilitiesQuery, IReadOnlyList<AvailabilityDto>>
{
    private readonly IShiftDbContext _db;

    public ListAvailabilitiesHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AvailabilityDto>> Handle(
        ListAvailabilitiesQuery request, CancellationToken ct)
    {
        return await _db.Availabilities
            .Where(a => a.UserId == request.UserId)
            .OrderBy(a => a.DayOfWeek).ThenBy(a => a.StartTime)
            .Select(a => new AvailabilityDto(
                a.Id, a.UserId, (int)a.DayOfWeek,
                a.StartTime, a.EndTime, a.Reason))
            .ToListAsync(ct);
    }
}