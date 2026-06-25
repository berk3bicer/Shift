using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.Announcements.List;

namespace Shift.Application.Features.Announcements.Get;

public class GetAnnouncementHandler : IRequestHandler<GetAnnouncementQuery, AnnouncementDto?>
{
    private readonly IShiftDbContext _db;

    public GetAnnouncementHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<AnnouncementDto?> Handle(GetAnnouncementQuery request, CancellationToken ct)
    {
        // Global filter → sadece bu tenant'ın duyurusu (IDOR koruması).
        return await _db.Announcements
            .Where(a => a.Id == request.Id)
            .Select(a => new AnnouncementDto(
                a.Id,
                a.Title,
                a.Body,
                a.BranchId,
                (int?)a.TargetRole,
                a.CreatedByUserId,
                a.CreatedByUser != null ? a.CreatedByUser.FullName : null,
                a.CreatedAt))
            .FirstOrDefaultAsync(ct);
    }
}
