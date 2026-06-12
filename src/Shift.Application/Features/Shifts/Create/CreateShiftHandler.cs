using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Application.Features.Shifts.Create;

public class CreateShiftHandler : IRequestHandler<CreateShiftCommand, CreateShiftResult>
{
    private readonly IShiftDbContext _db;
    private readonly IShiftRuleChecker _ruleChecker;

    public CreateShiftHandler(IShiftDbContext db, IShiftRuleChecker ruleChecker)
    {
        _db = db;
        _ruleChecker = ruleChecker;
    }

    public async Task<CreateShiftResult> Handle(CreateShiftCommand request, CancellationToken ct)
    {
        // ── FK güvenliği: gönderilen ID'ler bu tenant'a ait mi? (global filter altında) ──
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        var positionExists = await _db.Positions.AnyAsync(p => p.Id == request.PositionId, ct);
        if (!positionExists)
            throw new InvalidOperationException("Pozisyon bulunamadı.");

        if (request.UserId.HasValue)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId.Value, ct);
            if (!userExists)
                throw new InvalidOperationException("Atanacak personel bulunamadı.");
        }

        // ── İş kuralları (çakışma→throw, İş Kanunu limitleri→uyarı) ──
        // Create'te dışlanacak vardiya yok → excludeShiftId: null.
        var warnings = await _ruleChecker.CheckAsync(
            request.UserId, request.StartTime, request.EndTime, excludeShiftId: null, ct);

        var shift = new ShiftEntity
        {
            // TenantId YOK — SaveChanges interceptor otomatik damgalar
            BranchId = request.BranchId,
            PositionId = request.PositionId,
            UserId = request.UserId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Notes = request.Notes,
            Status = Shift.Domain.Entities.ShiftStatus.Draft
        };

        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync(ct);

        return new CreateShiftResult(shift.Id, warnings);
    }
}