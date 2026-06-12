using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Availabilities.Create;

public class CreateAvailabilityHandler
    : IRequestHandler<CreateAvailabilityCommand, CreateAvailabilityResult>
{
    private readonly IShiftDbContext _db;

    public CreateAvailabilityHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CreateAvailabilityResult> Handle(
        CreateAvailabilityCommand request, CancellationToken ct)
    {
        // FK güvenliği: personel bu tenant'ta var mı? (global filter altında)
        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId, ct);
        if (!userExists)
            throw new InvalidOperationException("Personel bulunamadı.");

        var availability = new Availability
        {
            // TenantId YOK — interceptor damgalar
            UserId = request.UserId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Reason = request.Reason
        };

        _db.Availabilities.Add(availability);
        await _db.SaveChangesAsync(ct);

        return new CreateAvailabilityResult(availability.Id);
    }
}