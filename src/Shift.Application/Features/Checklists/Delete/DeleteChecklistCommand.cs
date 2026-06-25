using MediatR;

namespace Shift.Application.Features.Checklists.Delete;

public record DeleteChecklistCommand(Guid Id) : IRequest<Unit>;
