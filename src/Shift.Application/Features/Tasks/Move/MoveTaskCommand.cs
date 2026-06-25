using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Tasks.Move;

// Görevi bir Kanban sütunundan diğerine taşır (kartı sürükle-bırak). Durum geçişinin
// TEK kapısı burası — içerik düzenleme (UpdateTask) durumu değiştiremez.
public record MoveTaskCommand(Guid Id, TaskItemStatus NewStatus)
    : IRequest<MoveTaskResult>;

public record MoveTaskResult(Guid TaskId, string Status);
