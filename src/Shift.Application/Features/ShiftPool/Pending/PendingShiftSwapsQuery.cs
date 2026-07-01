using MediatR;

namespace Shift.Application.Features.ShiftPool.Pending;

// Yöneticinin onay kuyruğu: tüm bekleyen (Pending) havuz talepleri.
// Tenant izolasyonu global filter'dan — PendingTimeOffQuery ile aynı desen.
public record PendingShiftSwapsQuery() : IRequest<IReadOnlyList<PendingShiftSwapDto>>;

public record PendingShiftSwapDto(
    Guid SwapId,
    int Type,
    Guid ShiftId,
    Guid BranchId,
    string BranchName,
    Guid PositionId,
    string PositionName,
    DateTime StartTime,
    DateTime EndTime,
    Guid RequestedByUserId,
    string RequestedByUserName,
    DateTime CreatedAt
);
