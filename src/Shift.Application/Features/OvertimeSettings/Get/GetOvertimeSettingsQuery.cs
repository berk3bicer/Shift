using MediatR;

namespace Shift.Application.Features.OvertimeSettings.Get;

// İşletmenin mesai ayarlarını getirir. Parametre yok — tenant token'dan gelir,
// global filter zaten o tenant'ın kaydını bulur.
public record GetOvertimeSettingsQuery() : IRequest<OvertimeSettingsDto>;

// Ayarların dışa dönük hali. Entity'yi doğrudan dönmeyiz (API sözleşmesi
// entity'den ayrı olmalı — entity değişse bile sözleşme korunur).
// TimeOnly'yi string olarak döneriz ("20:00") — JSON'da temiz ve frontend dostu.
public record OvertimeSettingsDto(
    decimal WeeklyOvertimeThresholdHours,
    decimal OvertimeMultiplier,
    decimal NightMultiplier,
    string NightStart,
    string NightEnd,
    decimal WeekendMultiplier,
    decimal HolidayMultiplier
);