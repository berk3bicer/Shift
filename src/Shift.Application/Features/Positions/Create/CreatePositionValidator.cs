using FluentValidation;

namespace Shift.Application.Features.Positions.Create;

public class CreatePositionValidator : AbstractValidator<CreatePositionCommand>
{
    public CreatePositionValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);

        // Renk verilirse hex formatına benzesin (#RRGGBB)
        RuleFor(x => x.ColorCode)
            .Matches("^#[0-9A-Fa-f]{6}$")
            .When(x => !string.IsNullOrEmpty(x.ColorCode))
            .WithMessage("Renk kodu #RRGGBB formatında olmalı (örn. #22C55E).");

        // Saat ücreti verilirse negatif olmasın
        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(0)
            .When(x => x.HourlyRate.HasValue);
    }
}