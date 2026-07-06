using FluentValidation;

namespace Shift.Application.Features.Auth.ResetPassword;

public class ResetPasswordValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Token).NotEmpty();

        // Login/Register'la aynı pratik: en az 6 karakter.
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6);
    }
}
