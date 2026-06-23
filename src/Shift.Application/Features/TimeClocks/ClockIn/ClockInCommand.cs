using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeClocks.ClockIn;

// Personel işe giriş yapar. UserId CLIENT'tan GELMEZ — token'dan okunur
// (ICurrentUserProvider). Client yalnızca hangi şubede ve hangi yöntemle
// giriş yaptığını bildirir.
public record ClockInCommand(
    Guid BranchId,
    ClockMethod Method
) : IRequest<ClockInResult>;

// Sonuç: oluşan puantaj kaydının id'si + giriş anı + geç mi.
// Frontend "09:15'te giriş yaptınız (geç)" gibi gösterir.
public record ClockInResult(
    Guid TimeClockId,
    DateTime CheckInTime,
    bool IsLate
);