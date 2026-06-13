using FluentValidation;

namespace Shift.Application.Features.TimeOff.Create;

public class CreateTimeOffValidator : AbstractValidator<CreateTimeOffCommand>
{
    public CreateTimeOffValidator()
    {
        // Bitiş, başlangıçtan önce olamaz. Aynı gün izin olabilir (tek günlük izin),
        // o yüzden GreaterThanOrEqualTo — Availability'deki strict GreaterThan'dan farklı.
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Bitiş tarihi başlangıç tarihinden önce olamaz.");

        RuleFor(x => x.Reason).MaximumLength(500);
    }
}