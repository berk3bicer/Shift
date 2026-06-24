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
    // Personelin pozisyonu yoksa ya da pozisyonun HourlyRate'i null'sa, üçü de null.
    // null ≠ 0: 0 "bedava çalıştı" der (yanlış); null "ücret girilmemiş" der (doğru).
    decimal? AppliedHourlyRate,  // Hesapta kullanılan saat ücreti (snapshot)
    decimal? OvertimeMultiplier, // Uygulanan fazla mesai çarpanı (snapshot)
    decimal? GrossAmount         // Brüt = normal×ücret + fazla×ücret×çarpan
);