using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Branches.List;

public class ListBranchesHandler : IRequestHandler<ListBranchesQuery, IReadOnlyList<BranchDto>>
{
    private readonly IShiftDbContext _db;

    public ListBranchesHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<BranchDto>> Handle(ListBranchesQuery request, CancellationToken ct)
    {
        // Global query filter sayesinde otomatik olarak SADECE bu tenant'ın şubeleri gelir.
        // Elle "Where(b => b.TenantId == ...)" yazmaya gerek yok — filtre zaten ekliyor.
        return await _db.Branches
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto(
                b.Id, b.Name, b.Address, b.Latitude, b.Longitude, b.IsActive))
            .ToListAsync(ct);
    }
}