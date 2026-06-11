using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Shifts.List;

public class ListShiftsHandler : IRequestHandler<ListShiftsQuery, IReadOnlyList<ShiftDto>>
{
    private readonly IShiftDbContext _db;

    public ListShiftsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ShiftDto>> Handle(ListShiftsQuery request, CancellationToken ct)
    {
        // Tenant filtresi otomatik. Burada ek olarak şube + tarih aralığı kesişimi filtreliyoruz.
        // Kesişim kuralı: vardiya, aralık bitmeden başlıyor VE aralık başladıktan sonra bitiyor.
        return await _db.Shifts
            .Where(s => s.BranchId == request.BranchId
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