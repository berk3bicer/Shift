using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Bir Tenant'a (işletmeye) ait fiziksel şube.
// Vardiya, görev, checklist gibi operasyon entity'leri ileride BranchId taşıyacak.
public class Branch : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }

    // GPS konumu (giriş-çıkış geofence doğrulaması için ileride kullanılacak)
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Şube aktif mi? (kapatılan şube silinmez, pasifleştirilir)
    public bool IsActive { get; set; } = true;
}