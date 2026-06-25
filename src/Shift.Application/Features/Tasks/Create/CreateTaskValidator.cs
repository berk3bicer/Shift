using FluentValidation;

namespace Shift.Application.Features.Tasks.Create;

public class CreateTaskValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Görev başlığı zorunlu.")
            .MaximumLength(200);

        RuleFor(x => x.Description).MaximumLength(2000);

        // Enum dışı (uydurma) değer gelmesin.
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.Category).IsInEnum();

        // Atama tekilliği: bir görev ya kişiye ya pozisyona atanır, İKİSİNE BİRDEN değil.
        // İkisi de boş olabilir (havuzdaki atanmamış görev) — o serbest.
        RuleFor(x => x)
            .Must(x => !(x.AssignedUserId.HasValue && x.AssignedPositionId.HasValue))
            .WithMessage("Görev ya kişiye ya pozisyona atanır, ikisine birden değil.");
    }
}
