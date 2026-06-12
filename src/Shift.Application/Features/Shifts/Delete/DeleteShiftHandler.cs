using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Shifts.Delete;

public class DeleteShiftHandler : IRequestHandler<DeleteShiftCommand, Unit>
{
    private readonly IShiftDbContext _db;

    public DeleteShiftHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(DeleteShiftCommand request, CancellationToken ct)
    {
        // global filter → sadece bu tenant'ın vardiyası bulunur (IDOR koruması).
        var shift = await _db.Shifts.FirstOrDefaultAsync(s => s.Id == request.Id, ct);
        if (shift == null)
            throw new InvalidOperationException("Vardiya bulunamadı.");

        _db.Shifts.Remove(shift);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}