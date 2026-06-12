using MediatR;

namespace Shift.Application.Features.Shifts.Create;

// Vardiya oluşturur. UserId null ise "açık vardiya" (henüz kimseye atanmamış).
public record CreateShiftCommand(
    Guid BranchId,
    Guid PositionId,
    Guid? UserId,          // null = açık vardiya
    DateTime StartTime,
    DateTime EndTime,
    string? Notes
) : IRequest<CreateShiftResult>;

// Warnings: İş Kanunu limit ihlalleri gibi "engellemeyen ama haberdar eden"
// durumlar burada döner. Boş liste = hiçbir uyarı yok, her şey temiz.
public record CreateShiftResult(Guid ShiftId, IReadOnlyList<string> Warnings);