using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Entities = Shift.Domain.Entities;

namespace Shift.Application.Features.OvertimeSettings.Get;

public class GetOvertimeSettingsHandler
    : IRequestHandler<GetOvertimeSettingsQuery, OvertimeSettingsDto>
{
    private readonly IShiftDbContext _db;

    public GetOvertimeSettingsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<OvertimeSettingsDto> Handle(
        GetOvertimeSettingsQuery request, CancellationToken ct)
    {
        // Global filter bu tenant'ın kaydını otomatik bulur (varsa).
        var settings = await _db.OvertimeSettings.FirstOrDefaultAsync(ct);

        // ── LAZY DEFAULT ──
        // DB'de kayıt yoksa, varsayılan değerli yeni bir entity üretip onu
        // map'leriz. DB'ye HİÇBİR ŞEY yazmayız — sadece varsayılanları gösteririz.
        // Entity'nin property initializer'ları (= 45m, = 1.5m...) tek kaynak.
        settings ??= new Entities.OvertimeSettings();

        return new OvertimeSettingsDto(
            settings.WeeklyOvertimeThresholdHours,
            settings.OvertimeMultiplier,
            settings.NightMultiplier,
            settings.NightStart.ToString("HH\\:mm"),
            settings.NightEnd.ToString("HH\\:mm"),
            settings.WeekendMultiplier,
            settings.HolidayMultiplier);
    }
}