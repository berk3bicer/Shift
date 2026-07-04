using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Vardiya Havuzu onay modu — tenant başına TEK kayıt (OvertimeSettings ile
// aynı desen). Şube bazlı değil: işletme genelinde tek mod geçerli.
public class ShiftPoolSettings : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public PoolApprovalMode ApprovalMode { get; set; } = PoolApprovalMode.Open;
}

public enum PoolApprovalMode
{
    Open = 0,             // Give/Take anında uygulanır, onay gerekmez
    ApprovalRequired = 1, // Give/Take Pending kalır, yönetici onaylamadan Shift değişmez
    Closed = 2            // Personel havuzu kullanamaz (Give/Take → 403)
}
