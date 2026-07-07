using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

// DAVET modeli: yönetici şifre belirlemez. User IsActive=false + boş PasswordHash açılır,
// kriptografik davet token'ı üretilir (DB'ye HASH'i yazılır — RefreshToken deseni),
// personele linkli e-posta gider. Şifre accept-invite'ta personel tarafından konur.
// User + rol + şube + token tek SaveChanges'te → atomik (SaveChanges InvitationService'te).
public class CreateStaffHandler : IRequestHandler<CreateStaffCommand, CreateStaffResult>
{
    private readonly IShiftDbContext _db;
    private readonly IInvitationService _invites;

    public CreateStaffHandler(IShiftDbContext db, IInvitationService invites)
    {
        _db = db;
        _invites = invites;
    }

    public async Task<CreateStaffResult> Handle(CreateStaffCommand request, CancellationToken ct)
    {
        // E-posta GLOBAL benzersiz olmalı: login e-postayı tenant'tan bağımsız (global)
        // arar → tekil olmalı. Bu yüzden IgnoreQueryFilters (Register'daki gibi).
        var emailExists = await _db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == request.Email, ct);
        if (emailExists)
            throw new InvalidOperationException("Bu e-posta zaten kayıtlı.");

        // Şube bu tenant'a ait mi? (global filter altında)
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        if (request.PositionId is { } positionId)
        {
            var positionExists = await _db.Positions.AnyAsync(p => p.Id == positionId, ct);
            if (!positionExists)
                throw new InvalidOperationException("Pozisyon bulunamadı.");
        }

        // Roller global (tenant'sız) ve sabit seed'li → Type ile bul.
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Type == request.Role, ct);
        if (role is null)
            throw new InvalidOperationException("Rol bulunamadı.");

        var user = new User
        {
            // TenantId YOK — interceptor damgalar (tüm ITenantEntity'ler için).
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = string.Empty, // şifre yok — davet kabulünde personel koyar
            PositionId = request.PositionId,
            IsActive = false,            // davet bekliyor; login IsActive kontrolüyle kapalı
        };
        _db.Users.Add(user);

        _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        _db.UserBranches.Add(new UserBranch { UserId = user.Id, BranchId = request.BranchId });

        // Token üret + kaydet (bekleyen User/rol/şube ekleriyle tek SaveChanges) + e-posta.
        await _invites.SendInviteAsync(user, ct);

        return new CreateStaffResult(user.Id);
    }
}
