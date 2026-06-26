using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

// Register kalıbını taklit eder (BCrypt hash, TenantId interceptor'dan) ama yeni tenant
// AÇMAZ — var olan tenant'a personel ekler. User + UserRole + UserBranch (+ pozisyon)
// tek SaveChanges'te → atomik.
public class CreateStaffHandler : IRequestHandler<CreateStaffCommand, CreateStaffResult>
{
    private readonly IShiftDbContext _db;

    public CreateStaffHandler(IShiftDbContext db)
    {
        _db = db;
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
            // TenantId YOK — interceptor damgalar (User/UserRole/UserBranch hepsi ITenantEntity).
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            PositionId = request.PositionId,
            IsActive = true,
        };
        _db.Users.Add(user);

        _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        _db.UserBranches.Add(new UserBranch { UserId = user.Id, BranchId = request.BranchId });

        await _db.SaveChangesAsync(ct);

        return new CreateStaffResult(user.Id);
    }
}
