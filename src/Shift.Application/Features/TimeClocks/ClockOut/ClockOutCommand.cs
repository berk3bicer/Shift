using MediatR;

namespace Shift.Application.Features.TimeClocks.ClockOut;

// Personel çıkış yapar. Hiçbir parametre almaz — kim olduğu token'dan gelir,
// hangi kaydı kapatacağı da "o kişinin açık kaydı" olarak otomatik bulunur.
// Açık kayıt tekil olduğu için (ClockIn bunu garanti ediyor) belirsizlik yok.
public record ClockOutCommand() : IRequest<ClockOutResult>;

// Sonuç: kapatılan kayıt + çalışılan toplam süre (dakika).
// Frontend "8 sa 15 dk çalıştınız" gibi gösterir.
public record ClockOutResult(
    Guid TimeClockId,
    DateTime CheckInTime,
    DateTime CheckOutTime,
    double WorkedMinutes
);