using MediatR;

namespace Shift.Application.Features.Auth.Refresh;

public record RefreshCommand(string RefreshToken) : IRequest<RefreshResult>;

public record RefreshResult(string Token, string RefreshToken);