using MediatR;
using Shift.Application.Features.Tasks.List;

namespace Shift.Application.Features.Tasks.Mine;

// Çağıran personele ATANMIŞ görevler (kendi panosu). AssignedUserId JWT'den alınır
// (client'tan DEĞİL). Owner/Manager pano ucundan (ListTasksQuery) AYRI — o değişmedi.
// TaskDto yeniden kullanılır (Tasks.List).
public record MyTasksQuery(
    int? Status              // TaskItemStatus (int); null = hepsi
) : IRequest<IReadOnlyList<TaskDto>>;
