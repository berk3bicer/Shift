using MediatR;
using Shift.Application.Features.TimeOff.List;

namespace Shift.Application.Features.TimeOff.Mine;

// Personelin KENDİ izin talepleri. UserId parametre DEĞİL — token'dan gelir.
// Aynı TimeOffListItem DTO'sunu döndürür (List ile tutarlı).
public record MyTimeOffQuery() : IRequest<IReadOnlyList<TimeOffListItem>>;