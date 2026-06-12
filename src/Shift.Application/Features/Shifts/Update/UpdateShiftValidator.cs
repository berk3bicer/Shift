using FluentValidation;

namespace Shift.Application.Features.Shifts.Update;

public class UpdateShiftValidator : AbstractValidator<UpdateShiftCommand>
{
    public UpdateShiftValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.PositionId).NotEmpty();
        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Bitiş zamanı başlangıç zamanından sonra olmalı.");
        RuleFor(x => x.Notes).MaximumLength(500);
    }
}