using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// ── ÇALIŞTIRMA katmanı: doldurulmuş kontrol listesi (instance) ──
// Bir şablonun BELİRLİ bir şube + tarihte fiilen doldurulan hali. "Bugünün açılışı"
// = bir ChecklistRun. Şablon (Checklist) tanımdır; bu onun o günkü çalıştırmasıdır.
//
// Tamamlanma kaydı: tüm maddeler işaretlenince CompletedAt/CompletedByUserId otomatik
// damgalanır (spec: "Tamamlayan kişi ve saat otomatik kayıt altına alınır").
public class ChecklistRun : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Hangi şubede çalıştırıldı. Çalıştırma şubeye özel (şablon tenant'a).
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    // Hangi şablondan türedi. Şablon silinmesin (geçmiş çalıştırma anlamını yitirir) → Restrict.
    public Guid ChecklistId { get; set; }
    public Checklist Checklist { get; set; } = null!;

    // Hangi günün açılışı/kapanışı (operasyonel gün).
    public DateOnly RunDate { get; set; }

    // Şablon adı + türü, çalıştırma anında SNAPSHOT'lanır — şablon sonradan yeniden
    // adlandırılsa/pasifleşse bile bu çalıştırma ne olduğunu kendi içinde taşır.
    public string ChecklistName { get; set; } = null!;
    public ChecklistType Type { get; set; }

    // Çalıştırmayı kim başlattı (token'dan). Personel silinse run durur → SetNull.
    public Guid? StartedByUserId { get; set; }
    public User? StartedByUser { get; set; }

    // ── Tamamlanma (tüm maddeler işaretlenince otomatik) ──
    // null = henüz tamamlanmadı. Tek bir madde geri sökülürse (uncheck) tekrar null olur.
    public DateTime? CompletedAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public User? CompletedByUser { get; set; }

    // Bu çalıştırmanın maddeleri (start anında şablondan kopyalanmış snapshot'lar).
    public List<ChecklistRunItem> Items { get; set; } = new();
}

// Çalıştırmadaki TEK maddenin durumu. Metin, start anında şablondan KOPYALANIR
// (snapshot) — şablon değişse de geçmiş çalıştırma ne kontrol edildiğini korur.
// TenantId TAŞIR (ITenantEntity): ChecklistItem ile aynı gerekçe (izolasyon + EF uyarısı).
public class ChecklistRunItem : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ChecklistRunId { get; set; }
    public ChecklistRun ChecklistRun { get; set; } = null!;

    // Madde metni — şablondan donmuş kopya (kaynak ChecklistItem sonradan değişebilir).
    public string Text { get; set; } = null!;
    public int SortOrder { get; set; }

    // ── İşaretleme durumu + "kim/ne zaman" otomatik kaydı ──
    public bool IsChecked { get; set; }
    public Guid? CheckedByUserId { get; set; }   // işaretleyen (token'dan)
    public User? CheckedByUser { get; set; }
    public DateTime? CheckedAt { get; set; }     // ne zaman işaretlendi

    // Opsiyonel not ("dolap 4°C"). Tipli/zorunlu sıcaklık değeri Modül 6 (HACCP) işi.
    public string? Note { get; set; }
}
