using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Tasks.Create;

public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, CreateTaskResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public CreateTaskHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateTaskResult> Handle(CreateTaskCommand request, CancellationToken ct)
    {
        // ── FK güvenliği: gönderilen ID'ler bu tenant'a ait mi? (global filter altında) ──
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        if (request.AssignedUserId is { } userId)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == userId, ct);
            if (!userExists)
                throw new InvalidOperationException("Atanacak personel bulunamadı.");
        }

        if (request.AssignedPositionId is { } positionId)
        {
            var positionExists = await _db.Positions.AnyAsync(p => p.Id == positionId, ct);
            if (!positionExists)
                throw new InvalidOperationException("Atanacak pozisyon bulunamadı.");
        }

        var task = new TaskItem
        {
            // TenantId YOK — SaveChanges interceptor otomatik damgalar.
            BranchId = request.BranchId,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            Priority = request.Priority,
            Category = request.Category,
            AssignedUserId = request.AssignedUserId,
            AssignedPositionId = request.AssignedPositionId,
            Status = TaskItemStatus.ToDo,           // görev her zaman Yapılacak'ta doğar

            // "Kim oluşturdu/atadı" token'dan — client'tan değil (IDOR koruması).
            // Tamamlanma bildirimi ileride buna gidecek (MoveTaskHandler).
            CreatedByUserId = _currentUser.GetUserId()
        };

        _db.Tasks.Add(task);

        // Kişiye atandıysa o personele, pozisyona atandıysa o pozisyondaki (ve görevin
        // şubesine atanmış) herkese bildirim. else-if: ikisi de doluysa çift bildirim
        // olmasın (spec'te tek alan dolu). Atama + bildirimler aynı SaveChanges'te → atomik.
        if (request.AssignedUserId is { } assignedTo)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = assignedTo,
                Type = NotificationType.TaskAssigned,
                Message = "Sana bir görev atandı.",
                RelatedEntityId = task.Id,
                IsRead = false
            });
        }
        else if (request.AssignedPositionId is { } posId)
        {
            // Hedef: görevin şubesine atanmış (UserBranch) ∩ bu pozisyona sahip personel.
            // Oluşturan hariç — kendi attığın görev kendine bildirilmez (kişiye-atamayla tutarlı).
            var targetIds = await _db.UserBranches
                .Where(ub => ub.BranchId == request.BranchId)
                .Join(_db.Users, ub => ub.UserId, u => u.Id, (ub, u) => u)
                .Where(u => u.PositionId == posId && u.Id != task.CreatedByUserId)
                .Select(u => u.Id)
                .Distinct()
                .ToListAsync(ct);

            foreach (var targetId in targetIds)
            {
                _db.Notifications.Add(new Notification
                {
                    UserId = targetId,
                    Type = NotificationType.TaskAssigned,
                    Message = "Pozisyonuna bir görev atandı.",
                    RelatedEntityId = task.Id,
                    IsRead = false
                });
            }
        }

        await _db.SaveChangesAsync(ct);

        return new CreateTaskResult(task.Id);
    }
}
