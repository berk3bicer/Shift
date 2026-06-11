using MediatR;

namespace Shift.Application.Features.Shifts.List;

// Bir şubenin, belirli tarih aralığındaki vardiyalarını getirir (takvim görünümü).
public record ListShiftsQuery(
    Guid BranchId,
    DateTime RangeStart,
    DateTime RangeEnd
) : IRequest<IReadOnlyList<ShiftDto>>;

// Takvim kartı için gereken alanlar. Entity değil — DTO.
// Pozisyon adı/rengi ve personel adı, takvimde göstermek için düz alan olarak gelir.
public record ShiftDto(
    Guid Id,
    Guid BranchId,
    Guid? UserId,
    string? UserFullName,      // açık vardiyada null
    Guid PositionId,
    string PositionName,
    string? PositionColor,
    DateTime StartTime,
    DateTime EndTime,
    int Status,
    string? Notes
);