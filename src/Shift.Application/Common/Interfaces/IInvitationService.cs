using Shift.Domain.Entities;

namespace Shift.Application.Common.Interfaces;

// Davet e-postası gönderimi — CreateStaff (ilk davet) ve resend-invite (tekrar gönder)
// aynı adımları paylaşır: eski aktif token'ları iptal et + yeni token üret + e-posta.
public interface IInvitationService
{
    Task SendInviteAsync(User user, CancellationToken ct);
}
