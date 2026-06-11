using MediatR;

namespace Shift.Application.Features.Auth.Register;

// Yeni işletme sahibi kaydı: yeni Tenant + ilk User (Owner) yaratır.
public record RegisterCommand(
    string BusinessName,
    int BusinessType,
    string FullName,
    string Email,
    string Password
) : IRequest<RegisterResult>;

public record RegisterResult(Guid TenantId, Guid UserId);