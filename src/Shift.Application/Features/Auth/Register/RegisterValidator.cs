using FluentValidation;

namespace Shift.Application.Features.Auth.Register;

public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.BusinessName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.BusinessType).InclusiveBetween(0, 3); // Cafe..FastFood
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}