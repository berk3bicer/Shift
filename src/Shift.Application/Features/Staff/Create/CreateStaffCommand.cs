using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

// Mevcut işletmeye (tenant) personel DAVET eder — şifre yönetici tarafından belirlenmez:
// kullanıcı IsActive=false açılır, e-postadaki davet linkiyle şifresini kendi koyar
// (accept-invite) ve o anda aktifleşir. Spec Modül 7.2 (işe alım/davet).
public record CreateStaffCommand(
    string FullName,
    string Email,
    RoleType Role,        // Manager / AssistantManager / Staff (Owner/Supplier değil)
    Guid BranchId,
    Guid? PositionId
) : IRequest<CreateStaffResult>;

public record CreateStaffResult(Guid UserId);
