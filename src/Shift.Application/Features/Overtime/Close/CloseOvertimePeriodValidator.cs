using FluentValidation;

namespace Shift.Application.Features.Overtime.Close;

public class CloseOvertimePeriodValidator : AbstractValidator<CloseOvertimePeriodCommand>
{
    public CloseOvertimePeriodValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Personel seçilmeli.");

        // Bitiş, başlangıçtan önce olamaz.
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("Bitiş tarihi başlangıçtan önce olamaz.");

        // Dönem en fazla ~1 yıl (Summary ile aynı sınır).
        RuleFor(x => x)
            .Must(x => x.To.DayNumber - x.From.DayNumber <= 366)
            .WithMessage("Dönem en fazla 1 yıl olabilir.");
    }
}