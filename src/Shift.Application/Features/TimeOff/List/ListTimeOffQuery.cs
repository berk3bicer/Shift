using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.List;

// Bir personelin izin taleplerini listeler.
public record ListTimeOffQuery(Guid UserId) : IRequest<IReadOnlyList<TimeOffListItem>>;

// Dışa dönük DTO — entity'yi doğrudan sızdırmıyoruz.
// UserFullName: yönetici onay kuyruğunda "kim?" görünür olsun diye.
public record TimeOffListItem(
    Guid Id,
    Guid UserId,
    string UserFullName,
    DateOnly StartDate,
    DateOnly EndDate,
    TimeOffType Type,
    string? Reason,
    TimeOffStatus Status,
    Guid? DecidedByUserId,
    string? DecisionNote,
    DateTime CreatedAt
);