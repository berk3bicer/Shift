using FluentValidation;

namespace Shift.Application.Features.Shifts.Create;

public class CreateShiftValidator : AbstractValidator<CreateShiftCommand>
{
    public CreateShiftValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.PositionId).NotEmpty();

        // Bitiş, başlangıçtan sonra olmalı (iki alan arası kural)
        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Bitiş zamanı başlangıç zamanından sonra olmalı.");

        RuleFor(x => x.Notes).MaximumLength(500);
    }
}