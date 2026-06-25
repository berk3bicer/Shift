using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Checklists.Update;

// Şablonu günceller: ad, tür ve madde listesinin TAMAMINI değiştirir (replace).
// Maddeler liste sırasına göre yeniden numaralanır. Eski maddeler silinir (Cascade).
// Geçmiş çalıştırmalar etkilenmez — onlar metni snapshot'ladı, madde Id'sine bağlı değil.
public record UpdateChecklistCommand(
    Guid Id,
    ChecklistType Type,
    string Name,
    IReadOnlyList<string> Items
) : IRequest<Unit>;
