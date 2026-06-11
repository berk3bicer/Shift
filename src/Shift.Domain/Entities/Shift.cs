using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Tek bir vardiya kaydı. Bir şubeye ait, bir pozisyonda,
// bir zaman aralığında. Personel atanabilir veya boş (açık vardiya) olabilir.
public class Shift : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    // null = açık vardiya (open shift): henüz kimseye atanmamış, havuzda.
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public Guid PositionId { get; set; }
    public Position Position { get; set; } = null!;

    // Zaman aralığı — UTC saklanır.
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public ShiftStatus Status { get; set; } = ShiftStatus.Draft;

    // Vardiya notu ("badem sütü bitti, 14:00 rezervasyon")
    public string? Notes { get; set; }
}

public enum ShiftStatus
{
    Draft = 0,      // Taslak — yönetici hazırlıyor, personel görmüyor
    Published = 1   // Yayınlandı — personel görüyor
}