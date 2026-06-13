using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.Create;

// İzin talebi oluşturur. DİKKAT: UserId YOK — talep eden kişi token'dan gelir.
// Personel kendi adına talep açar; kimliğini client gönderemez (IDOR koruması).
public record CreateTimeOffCommand(
    DateOnly StartDate,
    DateOnly EndDate,
    TimeOffType Type,
    string? Reason
) : IRequest<CreateTimeOffResult>;

public record CreateTimeOffResult(Guid TimeOffRequestId);