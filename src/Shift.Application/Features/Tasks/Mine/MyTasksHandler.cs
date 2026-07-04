using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.Tasks.List;

namespace Shift.Application.Features.Tasks.Mine;

public class MyTasksHandler : IRequestHandler<MyTasksQuery, IReadOnlyList<TaskDto>>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public MyTasksHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<TaskDto>> Handle(MyTasksQuery request, CancellationToken ct)
    {
        // Kimlik JWT'den — client'tan UserId ALINMAZ (IDOR koruması). Tenant filtresi
        // otomatik; buna ek olarak AssignedUserId == çağıran → başkasının görevi SIZMAZ.
        var userId = _currentUser.GetUserId()
            ?? throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var query = _db.Tasks.Where(t => t.AssignedUserId == userId);

        if (request.Status is { } status)
            query = query.Where(t => (int)t.Status == status);

        // Sıralama ListTasksQuery ile aynı: öncelik (yüksek önce), sonra son tarih.
        return await query
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
            .Select(t => new TaskDto(
                t.Id,
                t.BranchId,
                t.Title,
                t.Description,
                t.DueDate,
                (int)t.Priority,
                (int)t.Category,
                (int)t.Status,
                t.AssignedUserId,
                t.AssignedUser != null ? t.AssignedUser.FullName : null,
                t.AssignedPositionId,
                t.AssignedPosition != null ? t.AssignedPosition.Name : null,
                t.StartedAt,
                t.CompletedAt))
            .ToListAsync(ct);
    }
}
