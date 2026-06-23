using MediatR;

namespace Shift.Application.Features.Overtime.Close;

// Bir personelin bir dönemini KAPATIR: mesaiyi hesaplayıp donmuş kayda çevirir.
// Sonuç: oluşan OvertimeRecord'un Id'si (çağıran sonra detayını çekebilir).
//
// from/to: dönem sınırları (gün bazlı, kapsayıcı). Genelde ayın 1'i – son günü.
// LockedByUserId YOK — kimlik token'dan (ICurrentUserProvider) gelir, client'tan asla.
public record CloseOvertimePeriodCommand(
    Guid UserId,
    DateOnly From,
    DateOnly To
) : IRequest<Guid>;