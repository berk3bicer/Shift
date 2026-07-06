using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Auth.Login;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IShiftDbContext _db;
    private readonly IJwtTokenGenerator _jwt;

    public LoginHandler(IShiftDbContext db, IJwtTokenGenerator jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken ct)
    {
        // Login'de henüz tenant bilinmiyor -> filtreyi bypass et, e-postayla global ara
        var user = await _db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        // Boş hash = davet bekleyen kullanıcı (şifre hiç konmadı). BCrypt.Verify boş
        // hash'te false dönmez, PATLAR → önce ele: aynı "hatalı" cevabı ver (500 değil).
        if (user is null
            || string.IsNullOrEmpty(user.PasswordHash)
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("E-posta veya şifre hatalı.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Hesap aktif değil.");

        // Kullanıcının rollerini çek
        var roles = await _db.UserRoles
            .IgnoreQueryFilters()
            .Where(ur => ur.UserId == user.Id)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Type)
            .ToListAsync(ct);

        var token = _jwt.GenerateToken(user, roles);

        // Refresh token üret, hash'leyip kaydet, ham halini dön
        var refreshToken = _jwt.GenerateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            TenantId = user.TenantId,
            UserId = user.Id,
            TokenHash = Shift.Application.Common.Security.TokenHasher.Hash(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
        await _db.SaveChangesAsync(ct);

        return new LoginResult(token, refreshToken, user.Id, user.TenantId);
    }
}