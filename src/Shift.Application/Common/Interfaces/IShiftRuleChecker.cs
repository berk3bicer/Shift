namespace Shift.Application.Common.Interfaces;

// Vardiya iş kurallarını tek yerde toplar: çakışma (hata → throw) +
// İş Kanunu limitleri (uyarı → dönen liste). Hem Create hem Update kullanır.
public interface IShiftRuleChecker
{
    // Verilen vardiya bilgisini kurallara karşı kontrol eder.
    // - userId null (açık vardiya) ise hiçbir kural çalışmaz, boş liste döner.
    // - Çakışma varsa InvalidOperationException fırlatır (kayıt engellenir).
    // - İş Kanunu limitleri aşılırsa uyarı listesi döner (kayıt engellenmez).
    // excludeShiftId: Update sırasında vardiyanın KENDİSİNİ hesap dışı tutmak için
    //   (yoksa vardiya kendi eski haliyle çakışır/toplanır). Create'te null.
    Task<IReadOnlyList<string>> CheckAsync(
        Guid? userId,
        DateTime startTime,
        DateTime endTime,
        Guid? excludeShiftId,
        CancellationToken ct);
}