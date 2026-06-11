using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// User <-> Role arasındaki çoğa-çok köprüsü.
// Bir kullanıcının birden fazla rolü olabilir (sahip + barista gibi).
public class UserRole : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}