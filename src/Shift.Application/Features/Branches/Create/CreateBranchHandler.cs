using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Branches.Create;

public class CreateBranchHandler : IRequestHandler<CreateBranchCommand, CreateBranchResult>
{
    private readonly IShiftDbContext _db;

    public CreateBranchHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CreateBranchResult> Handle(CreateBranchCommand request, CancellationToken ct)
    {
        // Aynı işletmede aynı adda şube var mı? (global query filter
        // zaten sadece bu tenant'ın şubelerini görür — izolasyon otomatik)
        var nameExists = await _db.Branches
            .AnyAsync(b => b.Name == request.Name, ct);

        if (nameExists)
            throw new InvalidOperationException("Bu isimde bir şube zaten var.");

        var branch = new Branch
        {
            // TenantId YOK — SaveChanges interceptor otomatik damgalar
            Name = request.Name,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude
        };

        _db.Branches.Add(branch);
        await _db.SaveChangesAsync(ct);

        return new CreateBranchResult(branch.Id);
    }
}