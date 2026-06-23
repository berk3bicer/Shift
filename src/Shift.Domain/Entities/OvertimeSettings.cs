using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// İşletme bazlı fazla mesai ve çarpan ayarları.
// Tenant başına TEK kayıt (bir işletmenin bir çarpan seti vardır).
// OvertimeCalculator (Gün 10) bu ayarları okuyup mesai tutarını hesaplar.
//
// Neden BranchId yok: çarpanlar işletme genelinde geçerli (yasa şubeye göre
// değişmez). İleride şube bazlı istenirse nullable BranchId eklenir.
public class OvertimeSettings : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // ── Haftalık fazla mesai eşiği ──
    // İş Kanunu: haftalık 45 saati aşan kısım fazla mesaidir.
    // Sabit 45 yerine alan tutuyoruz ki ileride parametrik olsun
    // (ShiftRuleChecker'daki sabit 45'in parametrik karşılığı).
    public decimal WeeklyOvertimeThresholdHours { get; set; } = 45m;

    // Fazla mesai zam çarpanı. İş Kanunu: %50 zamlı → çarpan 1.5.
    // "Normal saat ücreti × 1.5" demek. Ayarlanabilir (bazı işletmeler farklı verir).
    public decimal OvertimeMultiplier { get; set; } = 1.5m;

    // ── Gece çarpanı ──
    // Gece saat aralığına düşen çalışma saatlerine uygulanır.
    // Basit model (kullanıcı tercihi): yasal 7.5s gece limiti denetimi YOK,
    // sadece "gece saatlerine katsayı". 1.0 = gece farkı yok (varsayılan kapalı).
    public decimal NightMultiplier { get; set; } = 1.0m;

    // Gece aralığının başı ve sonu (TimeOnly). Varsayılan: 20:00–06:00.
    // Bu aralığa düşen çalışma saatleri NightMultiplier ile çarpılır.
    public TimeOnly NightStart { get; set; } = new TimeOnly(20, 0);
    public TimeOnly NightEnd { get; set; } = new TimeOnly(6, 0);

    // ── Hafta sonu çarpanı ──
    // Cumartesi/Pazar çalışmasına uygulanır. 1.0 = fark yok (varsayılan).
    public decimal WeekendMultiplier { get; set; } = 1.0m;

    // ── Resmi tatil çarpanı ──
    // Türkiye resmi tatil takvimindeki günlere uygulanır. 1.0 = fark yok.
    // (Tatil takvimi Adım 2'de gelecek; çarpan burada tanımlı.)
    public decimal HolidayMultiplier { get; set; } = 1.0m;
}