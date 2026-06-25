using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Tasks.List;

public class ListTasksHandler : IRequestHandler<ListTasksQuery, IReadOnlyList<TaskDto>>
{
    private readonly IShiftDbContext _db;

    public ListTasksHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TaskDto>> Handle(ListTasksQuery request, CancellationToken ct)
    {
        // Tenant filtresi otomatik. Şube zorunlu; status/atama opsiyonel daraltma.
        var query = _db.Tasks.Where(t => t.BranchId == request.BranchId);

        if (request.Status is { } status)
            query = query.Where(t => (int)t.Status == status);

        if (request.AssignedUserId is { } userId)
            query = query.Where(t => t.AssignedUserId == userId);

        // Sıralama: öncelik (Acil önce, yüksek değer önce), sonra son tarih (yakın önce).
        // Tarihsiz görevler (null) sona düşer.
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
