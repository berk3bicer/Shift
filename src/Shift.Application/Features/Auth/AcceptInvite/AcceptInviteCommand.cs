using MediatR;

namespace Shift.Application.Features.Auth.AcceptInvite;

// Davet linkindeki ham token + personelin seçtiği şifre. Anonim uç: davetli henüz
// login olamaz (IsActive=false). Başarıda e-posta döner → FE login formunu doldurur.
public record AcceptInviteCommand(string Token, string Password) : IRequest<AcceptInviteResult>;

public record AcceptInviteResult(string Email);
