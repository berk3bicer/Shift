using MediatR;

namespace Shift.Application.Features.Positions.List;

public record ListPositionsQuery() : IRequest<IReadOnlyList<PositionDto>>;

public record PositionDto(
    Guid Id,
    string Name,
    string? ColorCode,
    decimal? HourlyRate,
    bool IsActive
);