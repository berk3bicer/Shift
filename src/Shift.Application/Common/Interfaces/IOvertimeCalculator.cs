using Shift.Application.Common.Services.Overtime;

namespace Shift.Application.Common.Interfaces;

// Mesai hesap motoru. TimeClock kayıtlarından İş Kanunu'na göre
// saat bazlı mesai özeti üretir. Saf hesap — hiçbir şey YAZMAZ (ShiftRuleChecker gibi).
// Hem anlık görüntü (Query) hem ileride OvertimeRecord kalıcılaştırma bunu çağırır.
public interface IOvertimeCalculator
{
    // Tek personelin bir tarih aralığındaki mesai özetini hesaplar.
    // from/to: dönem sınırları (örn. ayın 1'i – son günü), gün bazlı.
    Task<StaffOvertimeSummary> CalculateForUserAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct);
}