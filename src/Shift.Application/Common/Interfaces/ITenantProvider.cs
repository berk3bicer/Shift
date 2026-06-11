namespace Shift.Application.Common.Interfaces;

public interface ITenantProvider
{
    Guid? GetTenantId();
}