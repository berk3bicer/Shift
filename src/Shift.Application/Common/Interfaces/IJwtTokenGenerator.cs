using Shift.Domain.Entities;

namespace Shift.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, IEnumerable<RoleType> roles);
    string GenerateRefreshToken();
}