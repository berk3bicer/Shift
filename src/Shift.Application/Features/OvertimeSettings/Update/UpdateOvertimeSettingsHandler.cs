using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.OvertimeSettings.Get;
using Entities = Shift.Domain.Entities;

namespace Shift.Application.Features.OvertimeSettings.Update;

public class UpdateOvertimeSettingsHandler
    : IRequestHandler<UpdateOvertimeSettingsCommand, OvertimeSettingsDto>
{
    private readonly IShiftDbContext _db;

    public UpdateOvertimeSettingsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<OvertimeSettingsDto> Handle(
        UpdateOvertimeSettingsCommand request, CancellationToken ct)
    {
        // ── UPSERT (lazy default'un yazma yarısı) ──
        // Bu tenant'ın kaydı var mı? Global filter otomatik bu tenant'a bakar.
        var settings = await _db.OvertimeSettings.FirstOrDefaultAsync(ct);

        var isNew = settings is null;
        if (isNew)
        {
            // Kayıt yoksa yeni oluştur. TenantId'yi ELLE set etmiyoruz —
            // SaveChanges interceptor token'dan otomatik damgalar (Gün 1 deseni).
            settings = new Entities.OvertimeSettings();
            _db.OvertimeSettings.Add(settings);
        }

        // Validator saatleri zaten doğruladı; burada güvenle parse ederiz.
        settings!.WeeklyOvertimeThresholdHours = request.WeeklyOvertimeThresholdHours;
        settings.OvertimeMultiplier = request.OvertimeMultiplier;
        settings.NightMultiplier = request.NightMultiplier;
        settings.NightStart = TimeOnly.Parse(request.NightStart);
        settings.NightEnd = TimeOnly.Parse(request.NightEnd);
        settings.WeekendMultiplier = request.WeekendMultiplier;
        settings.HolidayMultiplier = request.HolidayMultiplier;

        if (!isNew)
            settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

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