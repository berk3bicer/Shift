using MediatR;

namespace Shift.Application.Features.ChecklistRuns.Get;

// Tek çalıştırmanın tam detayı (maddeleri + kim/ne zaman işaretledi). Yönetici raporu.
public record GetChecklistRunQuery(Guid RunId) : IRequest<ChecklistRunDto?>;

public record ChecklistRunDto(
    Guid Id,
    Guid BranchId,
    Guid ChecklistId,
    string ChecklistName,
    int Type,
    DateOnly RunDate,
    Guid? StartedByUserId,
    string? StartedByUserName,
    DateTime? CompletedAt,
    Guid? CompletedByUserId,
    string? CompletedByUserName,
    int CheckedCount,
    int TotalCount,
    IReadOnlyList<ChecklistRunItemDto> Items
);

public record ChecklistRunItemDto(
    Guid Id,
    string Text,
    int SortOrder,
    bool IsChecked,
    Guid? CheckedByUserId,
    string? CheckedByUserName,
    DateTime? CheckedAt,
    string? Note
);
