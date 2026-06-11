using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Security;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Auth.Refresh;

public class RefreshHandler : IRequestHandler<RefreshCommand, RefreshResult>
{
    private readonly IShiftDbContext _db;
    private readonly IJwtTokenGenerator _jwt;

    public RefreshHandler(IShiftDbContext db, IJwtTokenGenerator jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<RefreshResult> Handle(RefreshCommand request, CancellationToken ct)
    {
        var incomingHash = TokenHasher.Hash(request.RefreshToken);

        // Token'ı hash'iyle bul (tenant context yok -> filtre bypass)
        var stored = await _db.RefreshTokens
            .IgnoreQueryFilters()
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == incomingHash, ct);

        if (stored is null || !stored.IsActive)
            throw new UnauthorizedAccessException("Geçersiz veya süresi dolmuş oturum.");

        // Rotasyon: eskisini iptal et
        stored.IsRevoked = true;

        // Kullanıcının rollerini çek (yeni access token için)
        var roles = await _db.UserRoles
            .IgnoreQueryFilters()
            .Where(ur => ur.UserId == stored.UserId)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Type)
            .ToListAsync(ct);

        // Yeni çift üret
        var newAccessToken = _jwt.GenerateToken(stored.User, roles);
        var newRefreshToken = _jwt.GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            TenantId = stored.TenantId,
            UserId = stored.UserId,
            TokenHash = TokenHasher.Hash(newRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _db.SaveChangesAsync(ct);

        return new RefreshResult(newAccessToken, newRefreshToken);
    }
}