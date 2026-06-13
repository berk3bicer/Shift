using Shift.Application.Common.Interfaces;

namespace Shift.Tests;

// Testte login olan kullanıcıyı elle belirlemek için sahte provider.
// FakeTenantProvider'ın kardeşi.
public class FakeCurrentUserProvider : ICurrentUserProvider
{
    public Guid? CurrentUserId { get; set; }
    public Guid? GetUserId() => CurrentUserId;
}