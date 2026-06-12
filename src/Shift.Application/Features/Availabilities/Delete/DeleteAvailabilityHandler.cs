using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Availabilities.Delete;

public class DeleteAvailabilityHandler : IRequestHandler<DeleteAvailabilityCommand, Unit>
{
    private readonly IShiftDbContext _db;

    public DeleteAvailabilityHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(DeleteAvailabilityCommand request, CancellationToken ct)
    {
        var availability = await _db.Availabilities
            .FirstOrDefaultAsync(a => a.Id == request.Id, ct);
        if (availability == null)
            throw new InvalidOperationException("Müsaitlik kaydı bulunamadı.");

        _db.Availabilities.Remove(availability);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}