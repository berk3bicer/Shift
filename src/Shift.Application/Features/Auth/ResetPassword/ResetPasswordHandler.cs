using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Security;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Auth.ResetPassword;

// Şifre sıfırlama: token doğrula → şifreyi güncelle → token'ı tüket. Tek SaveChanges.
// Ek güvenlik: şifre değişince kullanıcının açık oturumları (refresh token'ları) iptal —
// şifreyi ele geçiren biri varsa eski oturumu da düşer.
public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IShiftDbContext _db;

    public ResetPasswordHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        var incomingHash = TokenHasher.Hash(request.Token);

        var token = await _db.OneTimeTokens
            .IgnoreQueryFilters()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == incomingHash
                                   && t.Purpose == TokenPurpose.PasswordReset, ct);

        if (token is null || !token.IsActive)
            throw new InvalidOperationException("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.");

        token.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        token.IsUsed = true;

        // Açık oturumları düşür (şifre değişti — eski refresh token'lar artık güvenilmez).
        var activeSessions = await _db.RefreshTokens
            .IgnoreQueryFilters()
            .Where(rt => rt.UserId == token.UserId && !rt.IsRevoked)
            .ToListAsync(ct);
        foreach (var session in activeSessions)
            session.IsRevoked = true;

        await _db.SaveChangesAsync(ct);
    }
}
