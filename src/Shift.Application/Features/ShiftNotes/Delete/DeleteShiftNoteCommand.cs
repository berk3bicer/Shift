using MediatR;

namespace Shift.Application.Features.ShiftNotes.Delete;

// Notu siler. CanDeleteAny = çağıran yönetici mi (Owner/Manager) — controller JWT
// rolünden belirler. false ise yalnız KENDİ notunu silebilir (başkasınınkini değil).
// Rol stringi Application katmanına sızmasın diye yetki "capability" (bool) olarak geçer.
public record DeleteShiftNoteCommand(Guid Id, bool CanDeleteAny) : IRequest<Unit>;
