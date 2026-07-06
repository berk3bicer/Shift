using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Tests;

// Login/refresh testleri için sahte üretici: gerçek imza yok, öngörülebilir çıktı.
// Refresh token her çağrıda benzersiz (hash çakışması olmasın diye Guid).
public class FakeJwtTokenGenerator : IJwtTokenGenerator
{
    public string GenerateToken(User user, IEnumerable<RoleType> roles) => $"fake-jwt-{user.Id}";
    public string GenerateRefreshToken() => Guid.NewGuid().ToString("N");
}
