using FluentValidation;

namespace Shift.Application.Features.Auth.AcceptInvite;

public class AcceptInviteValidator : AbstractValidator<AcceptInviteCommand>
{
    public AcceptInviteValidator()
    {
        RuleFor(x => x.Token).NotEmpty();

        // Login/Register'la aynı pratik: en az 6 karakter.
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}
