using MediatR;

namespace Shift.Application.Features.Overtime.Unlock;

// Kilitli bir mesai kaydının kilidini açar (düzeltme için).
// Kayıt SİLİNMEZ — sadece IsLocked=false olur + audit damgalanır.
// Sonrası: veriyi düzelt → aynı dönemi tekrar Close et (kilitsiz kayda yeniden yazar).
public record UnlockOvertimeRecordCommand(Guid Id) : IRequest;