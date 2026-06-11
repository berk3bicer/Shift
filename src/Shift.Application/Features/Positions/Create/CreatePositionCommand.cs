using MediatR;

namespace Shift.Application.Features.Positions.Create;

public record CreatePositionCommand(
    string Name,
    string? ColorCode,
    decimal? HourlyRate
) : IRequest<CreatePositionResult>;

public record CreatePositionResult(Guid PositionId);