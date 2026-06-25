using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Tasks.Create;

// Kanban görev kartı oluşturur. Görev her zaman ToDo (Yapılacak) sütununda doğar.
// Atama: AssignedUserId VEYA AssignedPositionId (ikisi de null = havuzda).
public record CreateTaskCommand(
    Guid BranchId,
    string Title,
    string? Description,
    DateTime? DueDate,
    TaskPriority Priority,
    TaskCategory Category,
    Guid? AssignedUserId,       // kişiye atama
    Guid? AssignedPositionId    // pozisyona atama ("tüm garsonlar")
) : IRequest<CreateTaskResult>;

public record CreateTaskResult(Guid TaskId);
