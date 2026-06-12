using MediatR;

namespace Shift.Application.Features.Availabilities.Create;

// Personelin müsait OLMADIĞI tekrar eden zaman dilimini kaydeder.
public record CreateAvailabilityCommand(
    Guid UserId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Reason
) : IRequest<CreateAvailabilityResult>;

public record CreateAvailabilityResult(Guid AvailabilityId);