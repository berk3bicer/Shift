using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Personelin TEKRAR EDEN müsait OLMADIĞI zaman dilimi.
// "Salı 13:00–18:00 okul var, çalışamam" gibi. Haftalık desen — tarihi yok, sadece gün+saat.
// Time Off'tan farkı: bu tekrar eder (her Salı), Time Off tek seferlik tarih aralığıdır.
//
// Model: BLACKLIST. Varsayılan personel her zaman müsaittir; burada yalnızca
// müsait OLMADIĞI dilimleri girer. Kayıt yoksa → o gün tamamen müsait.
public class Availability : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Haftanın günü (Pazar=0 ... Cumartesi=6) — System.DayOfWeek enum'u.
    public DayOfWeek DayOfWeek { get; set; }

    // Müsait OLMADIĞI saat aralığı. Tarih yok, sadece saat (TimeOnly).
    // Tüm gün müsait değilse: 00:00–23:59 girilir.
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    // Neden müsait değil? ("Okul", "Diğer iş"). 7shifts'te zorunlu; bizde opsiyonel.
    public string? Reason { get; set; }
}