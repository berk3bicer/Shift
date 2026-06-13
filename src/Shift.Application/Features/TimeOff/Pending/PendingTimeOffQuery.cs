using MediatR;
using Shift.Application.Features.TimeOff.List;

namespace Shift.Application.Features.TimeOff.Pending;

// Yöneticinin onay kuyruğu: tüm personelin BEKLEYEN (Pending) talepleri.
// Tenant izolasyonu global filter'dan; ekstra UserId filtresi yok (hepsi).
public record PendingTimeOffQuery() : IRequest<IReadOnlyList<TimeOffListItem>>;