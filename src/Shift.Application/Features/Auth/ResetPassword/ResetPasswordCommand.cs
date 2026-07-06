using MediatR;

namespace Shift.Application.Features.Auth.ResetPassword;

// Reset linkindeki ham token + yeni şifre. Anonim uç.
public record ResetPasswordCommand(string Token, string NewPassword) : IRequest;
