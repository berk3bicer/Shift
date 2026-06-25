using FluentValidation;

namespace Shift.Application.Features.Attachments.Confirm;

public class ConfirmAttachmentValidator : AbstractValidator<ConfirmAttachmentCommand>
{
    public ConfirmAttachmentValidator()
    {
        RuleFor(x => x.OwnerType).IsInEnum();
        RuleFor(x => x.OwnerId).NotEmpty();
        RuleFor(x => x.StorageKey)
            .NotEmpty().WithMessage("Object key zorunlu.")
            .MaximumLength(500);
        RuleFor(x => x.ContentType).MaximumLength(100);
        RuleFor(x => x.FileName).MaximumLength(255);
    }
}
