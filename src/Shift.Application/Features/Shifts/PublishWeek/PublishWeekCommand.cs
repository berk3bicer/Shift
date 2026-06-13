using MediatR;

namespace Shift.Application.Features.Shifts.PublishWeek;

// Bir şubenin belirli tarih aralığındaki TÜM Draft vardiyalarını topluca yayınlar.
// Gerçek senaryo: yönetici haftayı tek tek değil, topluca yayınlar.
public record PublishWeekCommand(
    Guid BranchId,
    DateTime RangeStart,
    DateTime RangeEnd
) : IRequest<PublishWeekResult>;

// Kaç vardiya yayınlandı, kaç personele bildirim gitti.
public record PublishWeekResult(int PublishedCount, int NotifiedUserCount);