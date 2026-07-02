using MediatR;
using Shift.Application.Features.Shifts.List;

namespace Shift.Application.Features.Shifts.Mine;

// Çağıran personelin KENDİ vardiyaları (salt-okuma), tarih aralığında.
// UserId JWT'den alınır (client'tan DEĞİL) → veri kendini sınırlar.
// Owner/Manager listeleme ucundan (ListShiftsQuery) tamamen AYRI — o değişmedi.
// ShiftDto yeniden kullanılır (Shifts.List).
public record MyShiftsQuery(
    DateTime RangeStart,
    DateTime RangeEnd
) : IRequest<IReadOnlyList<ShiftDto>>;
