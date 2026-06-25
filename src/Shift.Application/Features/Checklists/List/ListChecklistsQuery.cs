using MediatR;

namespace Shift.Application.Features.Checklists.List;

// Şablonları listeler. Type verilirse o tür (sadece Açılış vb.); IncludeInactive false
// ise yalnız aktif şablonlar.
public record ListChecklistsQuery(
    int? Type,                  // ChecklistType (int); null = hepsi
    bool IncludeInactive = false
) : IRequest<IReadOnlyList<ChecklistDto>>;

// Şablon + maddeleri. Entity değil — DTO.
public record ChecklistDto(
    Guid Id,
    int Type,
    string Name,
    bool IsActive,
    IReadOnlyList<ChecklistItemDto> Items
);

public record ChecklistItemDto(Guid Id, string Text, int SortOrder);
