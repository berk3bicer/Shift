using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Tasks.Update;

public class UpdateTaskHandler : IRequestHandler<UpdateTaskCommand, Unit>
{
    private readonly IShiftDbContext _db;

    public UpdateTaskHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(UpdateTaskCommand request, CancellationToken ct)
    {
        // Global filter → yalnızca kendi tenant'ımızın görevi bulunur.
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.Id, ct);
        if (task is null)
            throw new InvalidOperationException("Görev bulunamadı.");

        // Atama değişiyorsa hedeflerin bu tenant'a ait olduğunu doğrula.
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

        task.Title = request.Title;
        task.Description = request.Description;
        task.DueDate = request.DueDate;
        task.Priority = request.Priority;
        task.Category = request.Category;
        task.AssignedUserId = request.AssignedUserId;
        task.AssignedPositionId = request.AssignedPositionId;
        task.UpdatedAt = DateTime.UtcNow;
        // Status'a DOKUNULMAZ — durum geçişi MoveTask'tan geçer.

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}
