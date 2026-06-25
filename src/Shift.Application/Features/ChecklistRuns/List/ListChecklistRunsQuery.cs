using MediatR;

namespace Shift.Application.Features.ChecklistRuns.List;

// Bir şubenin çalıştırmalarını listeler (yönetici takibi). Tür + tarih aralığı opsiyonel.
// Satır = özet (maddeler GetChecklistRun'da). "Bugün açılış yapıldı mı?" sorusunu yanıtlar.
public record ListChecklistRunsQuery(
    Guid BranchId,
    int? Type,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<ChecklistRunSummaryDto>>;

public record ChecklistRunSummaryDto(
    Guid Id,
    string ChecklistName,
    int Type,
    DateOnly RunDate,
    DateTime? CompletedAt,
    int CheckedCount,
    int TotalCount
);
