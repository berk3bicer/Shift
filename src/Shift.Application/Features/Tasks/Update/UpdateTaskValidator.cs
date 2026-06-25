using FluentValidation;

namespace Shift.Application.Features.Tasks.Update;

public class UpdateTaskValidator : AbstractValidator<UpdateTaskCommand>
{
    public UpdateTaskValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Görev başlığı zorunlu.")
            .MaximumLength(200);

        RuleFor(x => x.Description).MaximumLength(2000);

        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.Category).IsInEnum();

        // Create ile aynı kural: kişi VEYA pozisyon, ikisi birden değil.
        RuleFor(x => x)
            .Must(x => !(x.AssignedUserId.HasValue && x.AssignedPositionId.HasValue))
            .WithMessage("Görev ya kişiye ya pozisyona atanır, ikisine birden değil.");
    }
}
