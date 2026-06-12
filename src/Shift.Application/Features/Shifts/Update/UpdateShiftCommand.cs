using MediatR;

namespace Shift.Application.Features.Shifts.Update;

// Var olan bir vardiyayı günceller. Id ile hedef belirlenir.
public record UpdateShiftCommand(
    Guid Id,
    Guid PositionId,
    Guid? UserId,
    DateTime StartTime,
    DateTime EndTime,
    string? Notes
) : IRequest<UpdateShiftResult>;

public record UpdateShiftResult(Guid ShiftId, IReadOnlyList<string> Warnings);