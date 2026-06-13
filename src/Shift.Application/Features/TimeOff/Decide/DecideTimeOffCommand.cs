using MediatR;

namespace Shift.Application.Features.TimeOff.Decide;

// Bir izin talebini onaylar veya reddeder. Tek komut, iki sonuç.
// Id: hangi talep (URL'den gelir, controller set eder).
// Decision: hedef karar (Approve/Reject).
// DecisionNote: opsiyonel yönetici notu (özellikle red gerekçesi).
public record DecideTimeOffCommand(
    Guid Id,
    TimeOffDecision Decision,
    string? DecisionNote
) : IRequest<DecideTimeOffResult>;

// Komut seviyesinde sadece iki meşru karar var. Domain'deki TimeOffStatus'tan
// ayrı tutuyoruz: dışarıdan "Pending'e geri al" gibi bir karar gönderilemesin.
public enum TimeOffDecision
{
    Approve = 0,
    Reject = 1
}

public record DecideTimeOffResult(Guid Id, string Status);