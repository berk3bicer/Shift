using MediatR;
using Shift.Application.Features.OvertimeSettings.Get;

namespace Shift.Application.Features.OvertimeSettings.Update;

// İşletmenin mesai ayarlarını günceller. Tüm alanlar tek seferde gönderilir
// (kısmi güncelleme değil — ayar ekranı hepsini bir arada gösterir/kaydeder).
// Saat alanları string ("20:00") gelir; handler TimeOnly'ye parse eder.
public record UpdateOvertimeSettingsCommand(
    decimal WeeklyOvertimeThresholdHours,
    decimal OvertimeMultiplier,
    decimal NightMultiplier,
    string NightStart,
    string NightEnd,
    decimal WeekendMultiplier,
    decimal HolidayMultiplier
) : IRequest<OvertimeSettingsDto>;