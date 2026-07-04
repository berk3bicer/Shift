using MediatR;

namespace Shift.Application.Features.ShiftPool.Give;

// Sahibi kendi vardiyasını havuza sunar. UserId token'dan gelir (IDOR koruması) —
// hangi personelin sunduğunu client söylemez, ShiftId'nin sahibi olup olmadığı
// handler'da kontrol edilir.
public record GiveShiftCommand(Guid ShiftId) : IRequest<ShiftSwapDto>;
