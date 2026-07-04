namespace Shift.Application.Features.ShiftPool;

// Give/Take/Approve/Reject ortak dönüş şekli. Type/Status/ShiftStatus int
// olarak döner — projedeki diğer enum DTO'larıyla aynı sözleşme (bkz. ShiftDto.Status).
public record ShiftSwapDto(
    Guid Id,
    Guid ShiftId,
    Guid RequestedByUserId,
    string RequestedByUserName,
    int Type,
    int Status,
    int ShiftStatus,
    DateTime CreatedAt
);
