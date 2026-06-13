using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Personelin TEK SEFERLİK, planlı devamsızlığı. "15–20 Temmuz tatildeyim."
// Availability'den farkı: bu bir TARİH ARALIĞIDIR (tekrar etmez) ve ONAYA tabidir.
// Availability bir tercih; Time Off onaylanmış (ya da reddedilmiş) bir taahhüt.
public class TimeOffRequest : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Talebi oluşturan personel.
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // İzin aralığı — gün bazlı (tarih). Saat detayı tutmuyoruz:
    // izin "gün" mantığında çalışır (15 Temmuz 00:00 → 20 Temmuz 23:59 kapsanır).
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    // [TR] İzin tipleri: yıllık ücretli, ücretsiz, hastalık, mazeret.
    public TimeOffType Type { get; set; }

    // Personelin gerekçesi (opsiyonel). "Aile ziyareti" vb.
    public string? Reason { get; set; }

    // ── ONAY DURUMU (state machine) ──
    // Talep her zaman Pending doğar. Yönetici Approved/Rejected yapar.
    // Approved/Rejected = terminal durum; tekrar değiştirilemez.
    public TimeOffStatus Status { get; set; } = TimeOffStatus.Pending;

    // Onaylayan/reddeden yönetici (karar verilince dolar). Karar öncesi null.
    public Guid? DecidedByUserId { get; set; }
    public User? DecidedByUser { get; set; }

    // Yöneticinin karar notu (red gerekçesi vb.). Opsiyonel.
    public string? DecisionNote { get; set; }
}

// [TR] Türkiye İş Kanunu izin tipleri.
public enum TimeOffType
{
    AnnualPaid = 0,   // Yıllık ücretli izin
    Unpaid = 1,       // Ücretsiz izin
    Sick = 2,         // Hastalık izni
    Excuse = 3        // Mazeret izni
}

// İzin talebinin yaşam döngüsü.
public enum TimeOffStatus
{
    Pending = 0,      // Beklemede — yönetici kararı bekliyor
    Approved = 1,     // Onaylandı (terminal)
    Rejected = 2      // Reddedildi (terminal)
}