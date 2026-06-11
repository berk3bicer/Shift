using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Auth.Register;

public class RegisterHandler : IRequestHandler<RegisterCommand, RegisterResult>
{
    private readonly IShiftDbContext _db;

    public RegisterHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<RegisterResult> Handle(RegisterCommand request, CancellationToken ct)
    {
        // Aynı e-posta global olarak kullanılmış mı? (Tenant henüz yok, filtre devrede değil)
        var emailExists = await _db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == request.Email, ct);

        if (emailExists)
            throw new InvalidOperationException("Bu e-posta zaten kayıtlı.");

        // 1) Yeni Tenant (işletme)
        var tenant = new Tenant
        {
            Name = request.BusinessName,
            Type = (BusinessType)request.BusinessType
        };
        _db.Tenants.Add(tenant);

        // 2) İlk User (sahip)
        var user = new User
        {
            TenantId = tenant.Id,
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };
        _db.Users.Add(user);

        // 3) Owner rolü ataması (seed'lediğimiz sabit Owner Id)
        var ownerRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        _db.UserRoles.Add(new UserRole
        {
            TenantId = tenant.Id,
            UserId = user.Id,
            RoleId = ownerRoleId
        });

        await _db.SaveChangesAsync(ct);

        return new RegisterResult(tenant.Id, user.Id);
    }
}