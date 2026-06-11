using Shift.Application.Common.Interfaces;

namespace Shift.Tests;

// Testte tenant'ı elle değiştirebilmek için sahte provider.
public class FakeTenantProvider : ITenantProvider
{
    public Guid? CurrentTenantId { get; set; }
    public Guid? GetTenantId() => CurrentTenantId;
}