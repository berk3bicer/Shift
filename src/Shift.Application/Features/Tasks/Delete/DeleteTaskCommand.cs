using MediatR;

namespace Shift.Application.Features.Tasks.Delete;

public record DeleteTaskCommand(Guid Id) : IRequest<Unit>;
