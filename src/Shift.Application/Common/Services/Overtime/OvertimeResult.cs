namespace Shift.Application.Common.Services.Overtime;

// Mesai hesabının çıktı tipleri. Calculator bunları üretir; saf veri, davranış yok.
// Şimdilik SADECE SAAT — ücret/çarpan/tutar yok (ücret altyapısı sonraki faz).

// Bir personelin BİR haftadaki mesai kırılımı.
// İş Kanunu fazla mesaiyi haftalık hesaplar → hafta, hesabın temel birimidir.
public record WeeklyOvertimeBreakdown(
    DateOnly WeekStart,          // Haftanın Pazartesi'si (deterministik)
    decimal TotalHours,          // O hafta çalışılan ham toplam saat
    decimal NormalHours,         // Eşiğe (45) kadar olan kısım
    decimal OvertimeHours        // Eşik üstü (fazla mesai)
);

// Bir personelin TÜM dönemdeki (ör. bir ay) mesai özeti.
// Haftalık kırılımların toplamı + kişi bilgisi.
public record StaffOvertimeSummary(
    Guid UserId,
    string UserFullName,
    decimal TotalHours,          // Dönemdeki tüm haftaların ham toplamı
    decimal NormalHours,         // Tüm haftaların normal saatleri toplamı
    decimal OvertimeHours,       // Tüm haftaların fazla mesai toplamı
    IReadOnlyList<WeeklyOvertimeBreakdown> Weeks  // Hafta hafta kırılım
);