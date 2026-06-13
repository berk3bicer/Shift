using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.Create;

public class CreateTimeOffHandler
    : IRequestHandler<CreateTimeOffCommand, CreateTimeOffResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public CreateTimeOffHandler(
        IShiftDbContext db,
        ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateTimeOffResult> Handle(
        CreateTimeOffCommand request, CancellationToken ct)
    {
        // Talebi oluşturan = login olan kullanıcı. CLIENT'tan değil, TOKEN'dan.
        // Böylece personel başkasının adına izin talebi açamaz.
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // FK güvenliği: kullanıcı bu tenant'ta gerçekten var mı? (global filter altında)
        // Token geçerli olsa bile, kullanıcı silinmiş/başka tenant olabilir.
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId.Value, ct);
        if (!userExists)
            throw new InvalidOperationException("Personel bulunamadı.");

        var timeOff = new TimeOffRequest
        {
            // TenantId YOK — interceptor damgalar.
            UserId = userId.Value,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Type = request.Type,
            Reason = request.Reason
            // Status YOK — entity'de default Pending. Talep her zaman beklemede doğar.
            // DecidedByUserId / DecisionNote YOK — karar verilince dolacak.
        };

        _db.TimeOffRequests.Add(timeOff);
        await _db.SaveChangesAsync(ct);

        return new CreateTimeOffResult(timeOff.Id);
    }
}