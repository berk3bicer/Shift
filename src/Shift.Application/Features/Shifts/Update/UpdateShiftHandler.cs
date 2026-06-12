using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Shifts.Update;

public class UpdateShiftHandler : IRequestHandler<UpdateShiftCommand, UpdateShiftResult>
{
    private readonly IShiftDbContext _db;
    private readonly IShiftRuleChecker _ruleChecker;

    public UpdateShiftHandler(IShiftDbContext db, IShiftRuleChecker ruleChecker)
    {
        _db = db;
        _ruleChecker = ruleChecker;
    }

    public async Task<UpdateShiftResult> Handle(UpdateShiftCommand request, CancellationToken ct)
    {
        // Hedef vardiyayı bul (global filter → sadece bu tenant'ın vardiyası gelir).
        var shift = await _db.Shifts.FirstOrDefaultAsync(s => s.Id == request.Id, ct);
        if (shift == null)
            throw new InvalidOperationException("Vardiya bulunamadı.");

        // FK güvenliği: yeni pozisyon/personel bu tenant'a ait mi?
        var positionExists = await _db.Positions.AnyAsync(p => p.Id == request.PositionId, ct);
        if (!positionExists)
            throw new InvalidOperationException("Pozisyon bulunamadı.");

        if (request.UserId.HasValue)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId.Value, ct);
            if (!userExists)
                throw new InvalidOperationException("Atanacak personel bulunamadı.");
        }

        // İş kuralları — KENDİNİ dışla (yoksa vardiya kendi eski haliyle çakışır/toplanır).
        var warnings = await _ruleChecker.CheckAsync(
            request.UserId, request.StartTime, request.EndTime, excludeShiftId: shift.Id, ct);

        // Güncelle. BranchId değişmez (vardiya şubesi sabit); pozisyon/personel/saat/not güncellenir.
        shift.PositionId = request.PositionId;
        shift.UserId = request.UserId;
        shift.StartTime = request.StartTime;
        shift.EndTime = request.EndTime;
        shift.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);

        return new UpdateShiftResult(shift.Id, warnings);
    }
}