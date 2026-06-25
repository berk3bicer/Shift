using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Vardiyadan vardiyaya OPERASYONEL NOT (spec Modül 2.3 — [MVP] "Shift Notes" kısmı).
// "Sabah ekibi akşam ekibine" tarzı handoff akışı: bir şubenin bir gününe ait, serbest
// metinli, üst üste birikebilen notlar (feed). Sabah biri bırakır, akşam biri okur+ekler.
//
// NEDEN ayrı entity (Shift.Notes ile karıştırma):
//   - Shift.Notes      → BELİRLİ bir vardiya KAYDINA iliştirilmiş tekil alan.
//   - ShiftNote (bu)   → BAĞIMSIZ, şube+gün bazlı handoff AKIŞI (vardiya kaydına bağlı değil).
// İkisi farklı kavram; isim benzerliği var ama ilişki yok.
//
// Faz sınırı: kategorize olay kaydı, aranabilir arşiv, sahibe gün-sonu özet bildirimi,
// yapılandırılmış olağanüstü olay (kaza/şikayet/sağlık) = [Faz 2] "Manager Logbook".
// Burada YOK — bu sadece [MVP] serbest metin handoff notu.
public class ShiftNote : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Notun ait olduğu şube. Şube silinse not geçmişi uçmasın → Restrict.
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    // Notun ait olduğu OPERASYONEL gün — yazıldığı an (CreatedAt) değil. Gece yarısını
    // aşan bir vardiyada 02:00'de yazılan not önceki güne ait olabilir; o yüzden ayrı alan.
    public DateOnly NoteDate { get; set; }

    // Serbest metin ("badem sütü bitti, sabah sipariş ver"; "14:00 rezervasyon var").
    public string Content { get; set; } = null!;

    // Notu kim bıraktı (token'dan, client'tan değil). Personel silinse not durur → SetNull.
    // Ne zaman bıraktığı = BaseEntity.CreatedAt.
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
}
