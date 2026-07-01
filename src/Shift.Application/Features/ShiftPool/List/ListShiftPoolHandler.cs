using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPool.List;

public class ListShiftPoolHandler : IRequestHandler<ListShiftPoolQuery, IReadOnlyList<ShiftPoolItemDto>>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public ListShiftPoolHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ShiftPoolItemDto>> Handle(
        ListShiftPoolQuery request, CancellationToken ct)
    {
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var caller = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (caller is null)
            throw new InvalidOperationException("Kullanıcı bulunamadı.");

        // Pozisyonsuz personel havuzda hiçbir şey görmez — kıyaslayacak kriter yok.
        if (caller.PositionId is null)
            return Array.Empty<ShiftPoolItemDto>();

        var myBranchIds = await _db.UserBranches
            .Where(ub => ub.UserId == userId.Value)
            .Select(ub => ub.BranchId)
            .ToListAsync(ct);

        var items = await _db.Shifts
            .Where(s => s.PositionId == caller.PositionId.Value
                     && myBranchIds.Contains(s.BranchId)
                     && (s.Status == ShiftStatus.UpForGrabs
                         || (s.UserId == null && s.Status == ShiftStatus.Published)))
            .OrderBy(s => s.StartTime)
            .Select(s => new ShiftPoolItemDto(
                s.Id,
                s.BranchId,
                s.Branch.Name,
                s.PositionId,
                s.Position.Name,
                s.StartTime,
                s.EndTime,
                (int)s.Status,
                s.User != null ? s.User.FullName : null,
                s.Notes))
            .ToListAsync(ct);

        return items;
    }
}
