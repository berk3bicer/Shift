using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Positions.Create;

public class CreatePositionHandler : IRequestHandler<CreatePositionCommand, CreatePositionResult>
{
    private readonly IShiftDbContext _db;

    public CreatePositionHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CreatePositionResult> Handle(CreatePositionCommand request, CancellationToken ct)
    {
        // Aynı isimde pozisyon var mı? (global filter → sadece bu tenant)
        var nameExists = await _db.Positions
            .AnyAsync(p => p.Name == request.Name, ct);

        if (nameExists)
            throw new InvalidOperationException("Bu isimde bir pozisyon zaten var.");

        var position = new Position
        {
            // TenantId YOK — interceptor damgalar
            Name = request.Name,
            ColorCode = request.ColorCode,
            HourlyRate = request.HourlyRate
        };

        _db.Positions.Add(position);
        await _db.SaveChangesAsync(ct);

        return new CreatePositionResult(position.Id);
    }
}