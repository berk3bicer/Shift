using FluentValidation;

namespace Shift.Application.Features.Overtime.Summary;

public class GetOvertimeSummaryValidator : AbstractValidator<GetOvertimeSummaryQuery>
{
    public GetOvertimeSummaryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Personel seçilmeli.");

        // Bitiş, başlangıçtan önce olamaz.
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("Bitiş tarihi başlangıçtan önce olamaz.");

        // Absürt geniş aralığı engelle (en fazla ~1 yıl). Performans + anlam.
        RuleFor(x => x)
            .Must(x => x.To.DayNumber - x.From.DayNumber <= 366)
            .WithMessage("Dönem en fazla 1 yıl olabilir.");
    }
}