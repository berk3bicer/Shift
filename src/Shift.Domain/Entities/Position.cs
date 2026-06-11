using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// İş pozisyonu (barista, kasiyer, komi...). Vardiya bir pozisyona bağlanır.
// Renk kodu takvim görünümünde kullanılır; saat ücreti mesai hesabını besler.
public class Position : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public string Name { get; set; } = string.Empty;

    // Takvimde pozisyon rengi (örn. "#22C55E"). Hex formatı, nullable.
    public string? ColorCode { get; set; }

    // Saat ücreti — mesai/bordro hesabı için. Para olduğu için decimal.
    public decimal? HourlyRate { get; set; }

    public bool IsActive { get; set; } = true;
}