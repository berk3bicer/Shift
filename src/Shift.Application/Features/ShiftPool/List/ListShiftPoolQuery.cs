using MediatR;

namespace Shift.Application.Features.ShiftPool.List;

// Personelin görebileceği havuz: kendi pozisyonundaki + kendi şubelerindeki
// açık (UserId=null, Published) veya sunulmuş (UpForGrabs) vardiyalar.
// Parametre yok — pozisyon/şube caller'ın kendi kaydından (token → User) gelir.
public record ListShiftPoolQuery() : IRequest<IReadOnlyList<ShiftPoolItemDto>>;

public record ShiftPoolItemDto(
    Guid Id,
    Guid BranchId,
    string BranchName,
    Guid PositionId,
    string PositionName,
    DateTime StartTime,
    DateTime EndTime,
    int Status,
    string? UserFullName,   // UpForGrabs'ta sunan kişi, açık vardiyada null
    string? Notes
);
