using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Checklists.Create;

// Kontrol listesi ŞABLONU oluşturur (tenant seviyesi). Maddeler liste sırasına göre
// SortOrder alır (0,1,2...). Çalıştırma (run) bundan türetilir, ayrı uç.
public record CreateChecklistCommand(
    ChecklistType Type,
    string Name,
    IReadOnlyList<string> Items     // madde metinleri; sıra = liste sırası
) : IRequest<CreateChecklistResult>;

public record CreateChecklistResult(Guid ChecklistId);
