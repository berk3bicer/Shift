using MediatR;

namespace Shift.Application.Features.Shifts.Create;

// Vardiya oluşturur. UserId null ise "açık vardiya" (henüz kimseye atanmamış).
public record CreateShiftCommand(
    Guid BranchId,
    Guid PositionId,
    Guid? UserId,          // null = açık vardiya
    DateTime StartTime,
    DateTime EndTime,
    string? Notes
) : IRequest<CreateShiftResult>;

public record CreateShiftResult(Guid ShiftId);