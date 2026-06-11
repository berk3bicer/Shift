using Microsoft.AspNetCore.Http;
using Shift.Application.Common.Interfaces;

namespace Shift.Infrastructure.MultiTenancy;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _overrideTenantId;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetTenantId()
    {
        // Elle set edilmişse (örn. test) onu kullan
        if (_overrideTenantId.HasValue)
            return _overrideTenantId;

        // Token'daki tenantId claim'ini oku
        var claim = _httpContextAccessor.HttpContext?.User
            ?.FindFirst("tenantId")?.Value;

        return Guid.TryParse(claim, out var id) ? id : null;
    }

    // Test veya özel durumlar için
    public void SetTenantId(Guid tenantId) => _overrideTenantId = tenantId;
}