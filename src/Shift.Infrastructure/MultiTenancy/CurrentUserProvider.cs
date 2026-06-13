using Microsoft.AspNetCore.Http;
using Shift.Application.Common.Interfaces;

namespace Shift.Infrastructure.MultiTenancy;

// TenantProvider ile aynı desen: HttpContext'teki JWT claim'lerinden okur.
// Fark: bu "userId" claim'ini okur (login olan kişinin kimliği).
public class CurrentUserProvider : ICurrentUserProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _overrideUserId;

    public CurrentUserProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetUserId()
    {
        // Elle set edilmişse (örn. test) onu kullan
        if (_overrideUserId.HasValue)
            return _overrideUserId;

        // Token'daki userId claim'ini oku
        var claim = _httpContextAccessor.HttpContext?.User
            ?.FindFirst("userId")?.Value;

        return Guid.TryParse(claim, out var id) ? id : null;
    }

    // Test veya özel durumlar için
    public void SetUserId(Guid userId) => _overrideUserId = userId;
}