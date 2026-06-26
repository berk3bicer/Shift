using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Staff.List;

public class ListStaffHandler : IRequestHandler<ListStaffQuery, IReadOnlyList<StaffDto>>
{
    private readonly IShiftDbContext _db;

    public ListStaffHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<StaffDto>> Handle(ListStaffQuery request, CancellationToken ct)
    {
        // Tenant filtresi otomatik. Rolleri UserRoles→Roles üzerinden topla (çok rol olabilir).
        return await _db.Users
            .OrderBy(u => u.FullName)
            .Select(u => new StaffDto(
                u.Id,
                u.FullName,
                u.Email,
                u.PositionId,
                u.Position != null ? u.Position.Name : null,
                _db.UserRoles
                    .Where(ur => ur.UserId == u.Id)
                    .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => (int)r.Type)
                    .ToArray(),
                u.IsActive))
            .ToListAsync(ct);
    }
}
