namespace Shift.Application.Common.Services.Overtime;

// Mesai hesabının çıktı tipleri. Calculator bunları üretir; saf veri, davranış yok.

// Bir personelin BİR haftadaki mesai kırılımı.
// İş Kanunu fazla mesaiyi haftalık hesaplar → hafta, hesabın temel birimidir.
// Ücret dönem seviyesinde hesaplanır (hafta değil) → burada ücret alanı YOK.
public record WeeklyOvertimeBreakdown(
    DateOnly WeekStart,          // Haftanın Pazartesi'si (deterministik)
    decimal TotalHours,          // O hafta çalışılan ham toplam saat
    decimal NormalHours,         // Eşiğe (45) kadar olan kısım
    decimal OvertimeHours        // Eşik üstü (fazla mesai)
);

// Bir personelin TÜM dönemdeki (ör. bir ay) mesai özeti.
// Haftalık kırılımların toplamı + kişi bilgisi + ücret hesabı.
public record StaffOvertimeSummary(
    Guid UserId,
    string UserFullName,
    decimal TotalHours,          // Dönemdeki tüm haftaların ham toplamı
    decimal NormalHours,         // Tüm haftaların normal saatleri toplamı
    decimal OvertimeHours,       // Tüm haftaların fazla mesai toplamı
    IReadOnlyList<WeeklyOvertimeBreakdown> Weeks,  // Hafta hafta kırılım

    // ── Ücret hesabı (null = ücret tanımsız, hesaplanamadı) ──
    // Personelin pozisyonu yoksa ya da pozisyonun HourlyRate'i null'sa, hepsi null.
    // null ≠ 0: 0 "bedava çalıştı"/"prim yok" der (yanlış); null "ücret girilmemiş" der (doğru).
    decimal? AppliedHourlyRate,  // Hesapta kullanılan saat ücreti (snapshot)
    decimal? OvertimeMultiplier, // Uygulanan fazla mesai çarpanı (snapshot)

    // ── Gece / hafta sonu primi (differential model) ──
    // Prim = primli vardiya saati × ücret × (çarpan − 1). Çarpan TÜM vardiyaya uygulanır
    // (vardiya gece penceresine değiyorsa / hafta sonuna düşüyorsa, o vardiyanın tüm
    // saatleri primli). Taban ücretin ÜSTÜNE eklenir; fazla mesai ekseninden bağımsız.
    // Ücret varsa ama çarpan 1.0 ise prim = 0 (gerçek sıfır), ücret yoksa null.
    decimal? NightPremium,       // Gece primi (çarpan−1 farkı)
    decimal? WeekendPremium,     // Hafta sonu primi (çarpan−1 farkı)

    decimal? GrossAmount         // Brüt = normal×ücret + fazla×ücret×fazlaÇarpan + gecePrim + haftaSonuPrim
);