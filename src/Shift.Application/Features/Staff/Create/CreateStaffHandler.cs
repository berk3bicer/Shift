using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Security;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Create;

// DAVET modeli: yönetici şifre belirlemez. User IsActive=false + boş PasswordHash açılır,
// kriptografik davet token'ı üretilir (DB'ye HASH'i yazılır — RefreshToken deseni),
// personele linkli e-posta gider. Şifre accept-invite'ta personel tarafından konur.
// User + rol + şube + token tek SaveChanges'te → atomik.
public class CreateStaffHandler : IRequestHandler<CreateStaffCommand, CreateStaffResult>
{
    // Davet linki 7 gün geçerli — makul işe-alım penceresi, sonsuz açık kapı değil.
    private static readonly TimeSpan InviteLifetime = TimeSpan.FromDays(7);

    private readonly IShiftDbContext _db;
    private readonly IEmailSender _email;
    private readonly AppUrlOptions _appUrl;

    public CreateStaffHandler(IShiftDbContext db, IEmailSender email, AppUrlOptions appUrl)
    {
        _db = db;
        _email = email;
        _appUrl = appUrl;
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

        // Ham token yalnızca e-postadaki linkte yaşar; DB'ye hash'i gider.
        var rawToken = TokenGenerator.Generate();
        _db.OneTimeTokens.Add(new OneTimeToken
        {
            UserId = user.Id,
            TokenHash = TokenHasher.Hash(rawToken),
            Purpose = TokenPurpose.Invite,
            ExpiresAt = DateTime.UtcNow.Add(InviteLifetime),
        });

        await _db.SaveChangesAsync(ct);

        // E-posta kayıttan SONRA: gönderim patlarsa kayıt durur, davet yeniden gönderilebilir.
        var tenantName = await _db.Tenants.Select(t => t.Name).FirstOrDefaultAsync(ct);
        var link = _appUrl.InviteLink(rawToken);
        await _email.SendAsync(
            request.Email,
            $"{tenantName ?? "Shift"} — ekibe davet edildiniz",
            $"""
            <p>Merhaba {request.FullName},</p>
            <p><strong>{tenantName ?? "İşletmeniz"}</strong> sizi Shift'e davet etti.
            Hesabınızı etkinleştirmek için şifrenizi belirleyin:</p>
            <p><a href="{link}">{link}</a></p>
            <p>Bu bağlantı 7 gün geçerlidir ve tek kullanımlıktır.</p>
            """,
            ct);

        return new CreateStaffResult(user.Id);
    }
}
