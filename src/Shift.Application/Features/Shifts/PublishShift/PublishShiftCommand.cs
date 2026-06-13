using MediatR;

namespace Shift.Application.Features.Shifts.PublishShift;

// Tek bir Draft vardiyayı Published'a geçirir.
// Id: hangi vardiya (URL'den gelir, controller set eder).
public record PublishShiftCommand(Guid Id) : IRequest<PublishShiftResult>;

public record PublishShiftResult(Guid Id, string Status);