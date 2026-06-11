using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// User <-> Branch arasındaki çoğa-çok köprüsü.
// Bir kullanıcı birden fazla şubede çalışabilir; bir şubede birden fazla kullanıcı olur.
// Owner bu tabloda yer almaz (kapsamı tüm tenant). Manager/Staff buraya bağlanır.
public class UserBranch : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
}