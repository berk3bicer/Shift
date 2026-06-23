using FluentValidation;

namespace Shift.Application.Features.OvertimeSettings.Update;

public class UpdateOvertimeSettingsValidator
    : AbstractValidator<UpdateOvertimeSettingsCommand>
{
    public UpdateOvertimeSettingsValidator()
    {
        // Haftalık eşik makul aralıkta. 1-168 (haftada en fazla 168 saat var).
        // Pratikte 40-50 ama sınırı geniş tutup absürdü engelliyoruz.
        RuleFor(x => x.WeeklyOvertimeThresholdHours)
            .InclusiveBetween(1, 168)
            .WithMessage("Haftalık fazla mesai eşiği 1-168 saat arasında olmalı.");

        // Çarpanlar 1.0'dan küçük olamaz (mesai normalden ucuza gelmez).
        // Üst sınır 10 — absürt değerleri (×100) engeller.
        RuleFor(x => x.OvertimeMultiplier)
            .InclusiveBetween(1m, 10m)
            .WithMessage("Fazla mesai çarpanı 1.0-10.0 arasında olmalı.");

        RuleFor(x => x.NightMultiplier)
            .InclusiveBetween(1m, 10m)
            .WithMessage("Gece çarpanı 1.0-10.0 arasında olmalı.");

        RuleFor(x => x.WeekendMultiplier)
            .InclusiveBetween(1m, 10m)
            .WithMessage("Hafta sonu çarpanı 1.0-10.0 arasında olmalı.");

        RuleFor(x => x.HolidayMultiplier)
            .InclusiveBetween(1m, 10m)
            .WithMessage("Resmi tatil çarpanı 1.0-10.0 arasında olmalı.");

        // Saat alanları "HH:mm" formatında parse edilebilmeli.
        RuleFor(x => x.NightStart)
            .Must(BeValidTime)
            .WithMessage("Gece başlangıcı geçerli saat formatında olmalı (örn. 20:00).");

        RuleFor(x => x.NightEnd)
            .Must(BeValidTime)
            .WithMessage("Gece bitişi geçerli saat formatında olmalı (örn. 06:00).");
    }

    // TimeOnly.TryParse ile "20:00" gibi bir değer geçerli mi diye bakar.
    private static bool BeValidTime(string value)
        => TimeOnly.TryParse(value, out _);
}