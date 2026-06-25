using FluentValidation;

namespace Shift.Application.Features.Checklists.Update;

public class UpdateChecklistValidator : AbstractValidator<UpdateChecklistCommand>
{
    public UpdateChecklistValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Type).IsInEnum();

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Liste adı zorunlu.")
            .MaximumLength(200);

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Kontrol listesi en az bir madde içermeli.");

        RuleForEach(x => x.Items)
            .NotEmpty().WithMessage("Madde metni boş olamaz.")
            .MaximumLength(500);
    }
}
