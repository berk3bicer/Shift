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
    // Çalıştırmanın başlatıldığı an (CreatedAt). Saat-of-day gösterimi için — runDate
    // sadece günü taşır. Salt-okuma projeksiyon (yeni kolon yok).
    DateTime StartedAt,
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
    string? Note,
    // Bu maddeye iliştirilmiş kanıt fotoğrafları (presigned indirme URL'li). Polimorfik
    // Attachment'tan (OwnerType=ChecklistRunItem, OwnerId=item.Id) okunur → reload'da kalıcı.
    IReadOnlyList<ChecklistItemAttachmentDto> Attachments
);

// Run item'a iliştirilmiş tek dosya (kanıt fotoğrafı) — FE görüntülemesi için minimal.
public record ChecklistItemAttachmentDto(
    Guid Id,
    string? FileName,
    string? ContentType,
    string DownloadUrl       // presigned GET (süreli)
);
