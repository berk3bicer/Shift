using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Entities = Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPoolSettings.Get;

public class GetShiftPoolSettingsHandler
    : IRequestHandler<GetShiftPoolSettingsQuery, ShiftPoolSettingsDto>
{
    private readonly IShiftDbContext _db;

    public GetShiftPoolSettingsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<ShiftPoolSettingsDto> Handle(
        GetShiftPoolSettingsQuery request, CancellationToken ct)
    {
        // Global filter bu tenant'ın kaydını otomatik bulur (varsa).
        var settings = await _db.ShiftPoolSettings.FirstOrDefaultAsync(ct);

        // Lazy default: kayıt yoksa varsayılan (Open) değerli entity üretip
        // map'leriz — DB'ye hiçbir şey yazmayız (OvertimeSettings deseni).
        settings ??= new Entities.ShiftPoolSettings();

        return new ShiftPoolSettingsDto((int)settings.ApprovalMode);
    }
}
