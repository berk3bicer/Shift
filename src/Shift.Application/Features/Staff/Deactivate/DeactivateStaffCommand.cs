using MediatR;

namespace Shift.Application.Features.Staff.Deactivate;

// İşten ayrılan personeli pasifleştir. Silme DEĞİL: User FK ile vardiya/puantaj/mesai
// kayıtlarına bağlı — silmek geçmişi (bordro, tamamlanmış vardiyalar) bozar.
// IsActive=false login'i keser (LoginHandler !IsActive → 401), kayıtlar korunur.
public record DeactivateStaffCommand(Guid UserId) : IRequest;
