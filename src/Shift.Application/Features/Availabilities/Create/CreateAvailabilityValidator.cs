using FluentValidation;

namespace Shift.Application.Features.Availabilities.Create;

public class CreateAvailabilityValidator : AbstractValidator<CreateAvailabilityCommand>
{
    public CreateAvailabilityValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Bitiş saati başlangıç saatinden sonra olmalı.");
        RuleFor(x => x.Reason).MaximumLength(200);
    }
}