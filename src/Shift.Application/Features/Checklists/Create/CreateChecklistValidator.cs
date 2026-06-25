using FluentValidation;

namespace Shift.Application.Features.Checklists.Create;

public class CreateChecklistValidator : AbstractValidator<CreateChecklistCommand>
{
    public CreateChecklistValidator()
    {
        RuleFor(x => x.Type).IsInEnum();

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Liste adı zorunlu.")
            .MaximumLength(200);

        // Boş şablon anlamsız — en az bir madde.
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Kontrol listesi en az bir madde içermeli.");

        // Her madde dolu ve makul uzunlukta.
        RuleForEach(x => x.Items)
            .NotEmpty().WithMessage("Madde metni boş olamaz.")
            .MaximumLength(500);
    }
}
