using FluentValidation;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

public class CreateStaffValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);

        RuleFor(x => x.Email).NotEmpty().EmailAddress();

        // Şifre kuralı YOK: davet modelinde şifreyi personel kendisi belirler (accept-invite).

        RuleFor(x => x.BranchId).NotEmpty();

        // Davetle yalnız ekip rolleri verilir: Owner (tek sahip) ve Supplier (dış) hariç.
        RuleFor(x => x.Role)
            .Must(r => r is RoleType.Manager or RoleType.AssistantManager or RoleType.Staff)
            .WithMessage("Rol yalnızca Yönetici, Asistan Yönetici veya Personel olabilir.");
    }
}
