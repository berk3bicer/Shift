using MediatR;

namespace Shift.Application.Features.Overtime.Records.List;

// Kapanmış mesai kayıtlarını listeler. Tüm filtreler opsiyonel (nullable):
//   - UserId boşsa: tenant'taki tüm personel
//   - From/To boşsa: tüm dönemler
// Liste hafif: haftalık kırılım (Weeks) TAŞINMAZ — o detay ucunda.
public record ListOvertimeRecordsQuery(
    Guid? UserId,
    DateOnly? From,
    DateOnly? To
) : IRequest<IReadOnlyList<OvertimeRecordListItem>>;

// Liste satırı: özet bilgi. Bordro tablosunun bir satırı.
// Para alanları (rate/çarpan/prim/brüt) kapanış anındaki DONMUŞ snapshot'tan okunur —
// burada hesap YAPILMAZ, sadece OvertimeRecord'da zaten yazılı değerler expose edilir.
// Yönetici grid'de brüt'ü görebilsin diye eklendi (önce sadece detail+CSV'deydi).
public record OvertimeRecordListItem(
    Guid Id,
    Guid UserId,
    string UserFullName,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    decimal TotalHours,
    decimal NormalHours,
    decimal OvertimeHours,
    decimal? AppliedHourlyRate,
    decimal? OvertimeMultiplier,
    decimal? NightPremium,
    decimal? WeekendPremium,
    decimal? GrossAmount,
    bool IsLocked,
    DateTime? LockedAt,
    DateTime? UnlockedAt
);