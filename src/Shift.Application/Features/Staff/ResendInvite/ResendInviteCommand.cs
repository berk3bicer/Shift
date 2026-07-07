using MediatR;

namespace Shift.Application.Features.Staff.ResendInvite;

// Daveti tekrar gönder: e-posta kaçtıysa/spam'e düştüyse. Eski davet linkleri iptal olur.
public record ResendInviteCommand(Guid UserId) : IRequest;
