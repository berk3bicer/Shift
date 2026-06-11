using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Application.Features.Shifts.Create;

public class CreateShiftHandler : IRequestHandler<CreateShiftCommand, CreateShiftResult>
{
    private readonly IShiftDbContext _db;

    public CreateShiftHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CreateShiftResult> Handle(CreateShiftCommand request, CancellationToken ct)
    {
        // ── FK güvenliği: gönderilen ID'ler GERÇEKTEN bu tenant'a ait mi? ──
        // Global query filter sayesinde bu sorgular sadece bu tenant'ın
        // kayıtlarını görür → "var mı?" sorusu otomatik "bu tenant'ta var mı?" olur.

        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        var positionExists = await _db.Positions.AnyAsync(p => p.Id == request.PositionId, ct);
        if (!positionExists)
            throw new InvalidOperationException("Pozisyon bulunamadı.");

        // UserId verildiyse (açık vardiya değilse) o kullanıcı bu tenant'ta var mı?
        if (request.UserId.HasValue)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId.Value, ct);
            if (!userExists)
                throw new InvalidOperationException("Atanacak personel bulunamadı.");
        }

        var shift = new ShiftEntity
        {
            // TenantId YOK — SaveChanges interceptor otomatik damgalar
            BranchId = request.BranchId,
            PositionId = request.PositionId,
            UserId = request.UserId,                    // null olabilir → açık vardiya
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Notes = request.Notes,
            Status = Shift.Domain.Entities.ShiftStatus.Draft  // taslak doğar
        };

        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync(ct);

        return new CreateShiftResult(shift.Id);
    }
}