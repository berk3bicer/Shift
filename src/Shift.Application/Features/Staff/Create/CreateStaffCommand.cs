using MediatR;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

// Mevcut işletmeye (tenant) personel ekler — Register'dan farkı: yeni tenant AÇMAZ,
// var olan tenant'a User + UserRole + UserBranch + (opsiyonel) pozisyon ekler.
// Spec Modül 7.2 (işe alım/davet) çekirdeği; aynı zamanda demo seed'inin doğru kanalı.
public record CreateStaffCommand(
    string FullName,
    string Email,
    string Password,
    RoleType Role,        // Manager / AssistantManager / Staff (Owner/Supplier değil)
    Guid BranchId,
    Guid? PositionId
) : IRequest<CreateStaffResult>;

public record CreateStaffResult(Guid UserId);
