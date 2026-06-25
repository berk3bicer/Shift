using MediatR;

namespace Shift.Application.Features.Tasks.List;

// Bir şubenin Kanban görevlerini getirir (pano görünümü). Status verilirse o sütun
// (ör. sadece Yapılacak); verilmezse tüm sütunlar. AssignedUserId ile "bana atananlar".
// Filtreler opsiyonel — frontend sütunlara kendisi gruplar.
public record ListTasksQuery(
    Guid BranchId,
    int? Status,            // TaskItemStatus (int); null = hepsi
    Guid? AssignedUserId    // null = atama filtresi yok
) : IRequest<IReadOnlyList<TaskDto>>;

// Pano kartı için gereken alanlar. Entity değil — DTO. Atanan kişi/pozisyon adı
// kartta göstermek için düz alan olarak gelir.
public record TaskDto(
    Guid Id,
    Guid BranchId,
    string Title,
    string? Description,
    DateTime? DueDate,
    int Priority,
    int Category,
    int Status,
    Guid? AssignedUserId,
    string? AssignedUserName,       // havuzda/pozisyon atamasında null
    Guid? AssignedPositionId,
    string? AssignedPositionName,   // kişi atamasında/havuzda null
    DateTime? StartedAt,
    DateTime? CompletedAt
);
