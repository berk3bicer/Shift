using MediatR;

namespace Shift.Application.Features.ShiftPool.Decide;

// Bekleyen bir havuz talebini (Give veya Take) onaylar veya reddeder.
// Tek komut, iki sonuç — DecideTimeOffCommand ile aynı desen.
public record DecideShiftSwapCommand(Guid SwapId, SwapDecision Decision) : IRequest<DecideShiftSwapResult>;

// Komut seviyesinde sadece iki meşru karar var. Domain'deki SwapStatus'tan
// ayrı tutuyoruz: dışarıdan "Pending'e geri al" gibi bir karar gönderilemesin.
public enum SwapDecision
{
    Approve = 0,
    Reject = 1
}

public record DecideShiftSwapResult(Guid SwapId, string Status, Guid ShiftId, int ShiftStatus);
