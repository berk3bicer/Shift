using FluentValidation;

namespace Shift.Application.Features.ShiftNotes.Create;

public class CreateShiftNoteValidator : AbstractValidator<CreateShiftNoteCommand>
{
    public CreateShiftNoteValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Not içeriği boş olamaz.")
            .MaximumLength(2000);
    }
}
