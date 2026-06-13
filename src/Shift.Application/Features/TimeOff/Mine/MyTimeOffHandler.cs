using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.TimeOff.List;

namespace Shift.Application.Features.TimeOff.Mine;

public class MyTimeOffHandler
    : IRequestHandler<MyTimeOffQuery, IReadOnlyList<TimeOffListItem>>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public MyTimeOffHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<TimeOffListItem>> Handle(
        MyTimeOffQuery request, CancellationToken ct)
    {
        // Kimin talepleri? Login olan kullanıcı — token'dan, client'tan değil.
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var items = await _db.TimeOffRequests
            .Where(t => t.UserId == userId.Value)
            .OrderByDescending(t => t.StartDate)
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