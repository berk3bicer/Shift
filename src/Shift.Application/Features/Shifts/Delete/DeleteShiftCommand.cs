using MediatR;

namespace Shift.Application.Features.Shifts.Delete;

public record DeleteShiftCommand(Guid Id) : IRequest<Unit>;