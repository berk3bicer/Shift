using MediatR;

namespace Shift.Application.Features.Overtime.Records.Get;

// Tek bir kapanmış mesai kaydının TAM detayı (haftalık kırılım dahil).
// Liste ucundan farkı: Weeks taşır. Bulunamazsa handler null döner → controller 404.
public record GetOvertimeRecordQuery(Guid Id)
    : IRequest<OvertimeRecordDetail?>;

// Detay sonucu: özet + haftalık kırılım + ücret alanları (şimdilik boş).
public record OvertimeRecordDetail(
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
    decimal? GrossAmount,
    bool IsLocked,
    DateTime? LockedAt,
    Guid? LockedByUserId,
    IReadOnlyList<OvertimeRecordWeekItem> Weeks
);

// Detaydaki bir haftanın kırılımı (jsonb snapshot'ın dışa açılmış hali).
public record OvertimeRecordWeekItem(
    DateOnly WeekStart,
    decimal TotalHours,
    decimal NormalHours,
    decimal OvertimeHours
);