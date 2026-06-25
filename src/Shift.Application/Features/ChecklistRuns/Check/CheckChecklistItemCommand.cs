using MediatR;

namespace Shift.Application.Features.ChecklistRuns.Check;

// Bir çalıştırma maddesini işaretler/işareti kaldırır. İşaretleyince "kim+saat" otomatik
// kaydedilir; tüm maddeler işaretlenince çalıştırma kendiliğinden tamamlanır.
public record CheckChecklistItemCommand(
    Guid RunId,
    Guid ItemId,
    bool IsChecked,
    string? Note
) : IRequest<CheckChecklistItemResult>;

// Pano/rapor için anlık özet: kaç madde işaretli, hepsi bitti mi.
public record CheckChecklistItemResult(
    Guid RunId,
    int CheckedCount,
    int TotalCount,
    bool IsCompleted
);
