using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Announcements.List;

public class ListAnnouncementsHandler
    : IRequestHandler<ListAnnouncementsQuery, IReadOnlyList<AnnouncementDto>>
{
    private readonly IShiftDbContext _db;

    public ListAnnouncementsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AnnouncementDto>> Handle(
        ListAnnouncementsQuery request, CancellationToken ct)
    {
        var query = _db.Announcements.AsQueryable();

        if (request.BranchId is { } branchId)
            query = query.Where(a => a.BranchId == branchId);
        if (request.TargetRole is { } role)
            query = query.Where(a => (int?)a.TargetRole == role);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AnnouncementDto(
                a.Id,
                a.Title,
                a.Body,
                a.BranchId,
                (int?)a.TargetRole,
                a.CreatedByUserId,
                a.CreatedByUser != null ? a.CreatedByUser.FullName : null,
                a.CreatedAt))
            .ToListAsync(ct);
    }
}
