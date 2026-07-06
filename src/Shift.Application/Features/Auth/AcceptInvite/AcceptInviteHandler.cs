using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Security;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Auth.AcceptInvite;

// Davet kabulü: gelen ham token hash'lenip aranır (DB'de ham token yok),
// eşleşme aktifse şifre konur + kullanıcı aktifleşir + token tüketilir. Tek SaveChanges.
public class AcceptInviteHandler : IRequestHandler<AcceptInviteCommand, AcceptInviteResult>
{
    private readonly IShiftDbContext _db;

    public AcceptInviteHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<AcceptInviteResult> Handle(AcceptInviteCommand request, CancellationToken ct)
    {
        var incomingHash = TokenHasher.Hash(request.Token);

        // Anonim uç: tenant context yok → filtre bypass (RefreshHandler deseni).
        var token = await _db.OneTimeTokens
            .IgnoreQueryFilters()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == incomingHash
                                   && t.Purpose == TokenPurpose.Invite, ct);

        // Tek mesaj: yok / kullanılmış / süresi dolmuş ayrımı dışarı sızdırılmaz.
        if (token is null || !token.IsActive)
            throw new InvalidOperationException("Davet bağlantısı geçersiz veya süresi dolmuş.");

        token.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        token.User.IsActive = true; // artık login olabilir
        token.IsUsed = true;        // tek kullanım — link ikinci kez çalışmaz

        await _db.SaveChangesAsync(ct);

        return new AcceptInviteResult(token.User.Email);
    }
}
