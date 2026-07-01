using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.ShiftPoolSettings.Get;
using Shift.Domain.Entities;
using Entities = Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPoolSettings.Update;

public class UpdateShiftPoolSettingsHandler
    : IRequestHandler<UpdateShiftPoolSettingsCommand, ShiftPoolSettingsDto>
{
    private readonly IShiftDbContext _db;

    public UpdateShiftPoolSettingsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<ShiftPoolSettingsDto> Handle(
        UpdateShiftPoolSettingsCommand request, CancellationToken ct)
    {
        // ── UPSERT (lazy default'un yazma yarısı — OvertimeSettings deseni) ──
        var settings = await _db.ShiftPoolSettings.FirstOrDefaultAsync(ct);

        var isNew = settings is null;
        if (isNew)
        {
            // TenantId ELLE set edilmiyor — SaveChanges interceptor damgalar.
            settings = new Entities.ShiftPoolSettings();
            _db.ShiftPoolSettings.Add(settings);
        }

        settings!.ApprovalMode = (PoolApprovalMode)request.ApprovalMode;

        if (!isNew)
            settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new ShiftPoolSettingsDto((int)settings.ApprovalMode);
    }
}
