using FluentValidation;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

public class CreateStaffValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);

        RuleFor(x => x.Email).NotEmpty().EmailAddress();

        // Login'le aynı pratik: en az 6 karakter (basit; politika ileride sertleşir).
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);

        RuleFor(x => x.BranchId).NotEmpty();

        // Davetle yalnız ekip rolleri verilir: Owner (tek sahip) ve Supplier (dış) hariç.
        RuleFor(x => x.Role)
            .Must(r => r is RoleType.Manager or RoleType.AssistantManager or RoleType.Staff)
            .WithMessage("Rol yalnızca Yönetici, Asistan Yönetici veya Personel olabilir.");
    }
}
