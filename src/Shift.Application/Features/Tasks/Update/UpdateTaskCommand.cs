using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Tasks.Update;

// Görev içeriğini + atamasını günceller. DURUM (Status) BURADAN DEĞİŞMEZ — durum
// geçişi state machine'den (MoveTask) geçer. İki sorumluluğu ayırmak: içerik düzenleme
// ile sütun taşıma farklı işler, farklı yan etkiler (taşımada zaman damgası/bildirim).
public record UpdateTaskCommand(
    Guid Id,
    string Title,
    string? Description,
    DateTime? DueDate,
    TaskPriority Priority,
    TaskCategory Category,
    Guid? AssignedUserId,
    Guid? AssignedPositionId
) : IRequest<Unit>;
