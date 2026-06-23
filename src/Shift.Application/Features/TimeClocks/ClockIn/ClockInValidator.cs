using FluentValidation;

namespace Shift.Application.Features.TimeClocks.ClockIn;

public class ClockInValidator : AbstractValidator<ClockInCommand>
{
    public ClockInValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Şube belirtilmeli.");

        // Enum dışı bir int gelirse (örn. Method=99) reddet.
        RuleFor(x => x.Method)
            .IsInEnum().WithMessage("Geçersiz giriş yöntemi.");
    }
}