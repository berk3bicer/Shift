using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Tasks.Delete;

public class DeleteTaskHandler : IRequestHandler<DeleteTaskCommand, Unit>
{
    private readonly IShiftDbContext _db;

    public DeleteTaskHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(DeleteTaskCommand request, CancellationToken ct)
    {
        // global filter → sadece bu tenant'ın görevi bulunur (IDOR koruması).
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.Id, ct);
        if (task is null)
            throw new InvalidOperationException("Görev bulunamadı.");

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}
