using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// ── TANIM katmanı: Kontrol listesi ŞABLONU (template) ──
// "Açılış Listesi" / "Kapanış Listesi" gibi bir kez tanımlanan, tekrar kullanılan
// liste tanımı (spec Modül 2.2). İşletme (tenant) seviyesinde — her şube AYNI şablonu
// çalıştırır. Doldurulmuş hali ayrı: ChecklistRun (her gün ondan bir çalıştırma türer).
//
// Şablon ≠ örnek: "bugünün listesi"ni tek seferlik tutmayız; şablonu bir kez tanımlar,
// günlük çalıştırmaları (run) ondan türetiriz.
public class Checklist : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Açılış mı kapanış mı (spec: "Açılış / Kapanış Kontrol Listeleri").
    public ChecklistType Type { get; set; }

    // "Sabah Açılış Listesi" gibi okunur ad.
    public string Name { get; set; } = null!;

    // Soft-disable: kullanımdan kaldırılan şablon silinmez (geçmiş run'lar ona bağlı),
    // sadece pasifleşir. Silme yerine IsActive=false → audit korunur.
    public bool IsActive { get; set; } = true;

    // Şablonun maddeleri. Şablonla yaşar/ölür → Cascade (ayrı tablo, owned değil:
    // ileride madde ekle/çıkar/sırala düzenlenebilsin).
    public List<ChecklistItem> Items { get; set; } = new();
}

// Şablondaki TEK madde tanımı: "Dolap sıcaklıkları kontrol edildi".
// Kendi başına kimliği var (eklenebilir/çıkarılabilir) ama sahibi Checklist.
// TenantId TAŞIR (ITenantEntity): her tabloya tenant damgası — izolasyon defense-in-depth
// + EF "filtreli parent ile zorunlu ilişki" uyarısını engeller (eşleşen query filter).
public class ChecklistItem : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ChecklistId { get; set; }
    public Checklist Checklist { get; set; } = null!;

    // Maddenin metni (kontrol edilecek şey).
    public string Text { get; set; } = null!;

    // Panoda/listede gösterim sırası.
    public int SortOrder { get; set; }
}

// Kontrol listesi türü (spec: Açılış / Kapanış).
public enum ChecklistType
{
    Opening = 0,  // Açılış
    Closing = 1   // Kapanış
}
