using FluentValidation;

namespace Shift.Application.Features.Announcements.Create;

public class CreateAnnouncementValidator : AbstractValidator<CreateAnnouncementCommand>
{
    public CreateAnnouncementValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Duyuru başlığı zorunlu.")
            .MaximumLength(200);

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Duyuru metni zorunlu.")
            .MaximumLength(4000);

        // TargetRole verildiyse geçerli enum olmalı (null = tüm ekip, o serbest).
        RuleFor(x => x.TargetRole!.Value)
            .IsInEnum()
            .When(x => x.TargetRole.HasValue);
    }
}
