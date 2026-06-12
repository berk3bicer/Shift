using MediatR;

namespace Shift.Application.Features.Availabilities.List;

// Bir personelin tüm müsaitlik kayıtlarını getirir.
public record ListAvailabilitiesQuery(Guid UserId)
    : IRequest<IReadOnlyList<AvailabilityDto>>;

public record AvailabilityDto(
    Guid Id,
    Guid UserId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Reason
);