using MediatR;

namespace Shift.Application.Features.ChecklistRuns.Start;

// Bir şablondan belirli şube + gün için çalıştırma BAŞLATIR. Maddeler şablondan
// snapshot'lanır. RunDate verilmezse bugün (UTC).
public record StartChecklistRunCommand(
    Guid ChecklistId,
    Guid BranchId,
    DateOnly? RunDate
) : IRequest<StartChecklistRunResult>;

public record StartChecklistRunResult(Guid RunId, int ItemCount);
