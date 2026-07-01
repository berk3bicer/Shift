using FluentValidation;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPoolSettings.Update;

public class UpdateShiftPoolSettingsValidator
    : AbstractValidator<UpdateShiftPoolSettingsCommand>
{
    public UpdateShiftPoolSettingsValidator()
    {
        RuleFor(x => x.ApprovalMode)
            .Must(v => Enum.IsDefined(typeof(PoolApprovalMode), v))
            .WithMessage("Onay modu geçersiz (Açık=0, Onay Gerekli=1, Kapalı=2).");
    }
}
