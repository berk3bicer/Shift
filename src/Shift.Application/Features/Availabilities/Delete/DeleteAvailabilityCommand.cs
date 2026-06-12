using MediatR;

namespace Shift.Application.Features.Availabilities.Delete;

public record DeleteAvailabilityCommand(Guid Id) : IRequest<Unit>;