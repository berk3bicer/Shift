using MediatR;

namespace Shift.Application.Features.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public record LoginResult(string Token, string RefreshToken, Guid UserId, Guid TenantId);