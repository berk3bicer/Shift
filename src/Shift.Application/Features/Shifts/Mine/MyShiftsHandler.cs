using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.Shifts.List;

namespace Shift.Application.Features.Shifts.Mine;

public class MyShiftsHandler : IRequestHandler<MyShiftsQuery, IReadOnlyList<ShiftDto>>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public MyShiftsHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ShiftDto>> Handle(MyShiftsQuery request, CancellationToken ct)
    {
        // Kimlik JWT'den — client'tan UserId ALINMAZ (IDOR koruması). Tenant filtresi
        // otomatik; buna ek olarak UserId == çağıran → başka personelin vardiyası SIZMAZ.
        var userId = _currentUser.GetUserId()
            ?? throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // Kesişim kuralı ListShiftsQuery ile aynı: aralık bitmeden başlar VE aralık
        // başladıktan sonra biter.
        return await _db.Shifts
            .Where(s => s.UserId == userId
                     && s.StartTime < request.RangeEnd
                     && s.EndTime > request.RangeStart)
            .OrderBy(s => s.StartTime)
            .Select(s => new ShiftDto(
                s.Id,
                s.BranchId,
                s.UserId,
                s.User != null ? s.User.FullName : null,
                s.PositionId,
                s.Position.Name,
                s.Position.ColorCode,
                s.StartTime,
                s.EndTime,
                (int)s.Status,
                s.Notes))
            .ToListAsync(ct);
    }
}
