using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.List;

// Bir personelin izin taleplerini listeler.
public record ListTimeOffQuery(Guid UserId) : IRequest<IReadOnlyList<TimeOffListItem>>;

// Dışa dönük DTO — entity'yi doğrudan sızdırmıyoruz.
public record TimeOffListItem(
    Guid Id,
    Guid UserId,
    DateOnly StartDate,
    DateOnly EndDate,
    TimeOffType Type,
    string? Reason,
    TimeOffStatus Status,
    Guid? DecidedByUserId,
    string? DecisionNote,
    DateTime CreatedAt
);