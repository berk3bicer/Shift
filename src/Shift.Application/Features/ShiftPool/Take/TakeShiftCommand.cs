using MediatR;

namespace Shift.Application.Features.ShiftPool.Take;

// Açık (UserId=null, Published) veya sunulmuş (UpForGrabs) bir vardiyayı üstlenir.
// UserId token'dan gelir — hangi personelin aldığını client söylemez.
public record TakeShiftCommand(Guid ShiftId) : IRequest<ShiftSwapDto>;
