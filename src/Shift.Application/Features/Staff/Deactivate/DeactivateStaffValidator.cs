using FluentValidation;

namespace Shift.Application.Features.Staff.Deactivate;

public class DeactivateStaffValidator : AbstractValidator<DeactivateStaffCommand>
{
    public DeactivateStaffValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("Kullanıcı kimliği zorunlu.");
    }
}
