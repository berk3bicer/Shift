using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Security;
using Shift.Domain.Entities;

namespace Shift.Application.Common.Services;

// Davet token'ı üret + hash'le + kaydet + e-posta gönder (RefreshToken deseni:
// ham token yalnız e-postadaki linkte yaşar, DB'ye hash'i gider).
// Handler'ın bekleyen ekleri (yeni User + rol + şube) buradaki SaveChanges'te
// token'la birlikte yazılır → CreateStaff atomikliği korunur.
public class InvitationService : IInvitationService
{
    // Davet linki 7 gün geçerli — makul işe-alım penceresi, sonsuz açık kapı değil.
    private static readonly TimeSpan InviteLifetime = TimeSpan.FromDays(7);

    private readonly IShiftDbContext _db;
    private readonly IEmailSender _email;
    private readonly AppUrlOptions _appUrl;

    public InvitationService(IShiftDbContext db, IEmailSender email, AppUrlOptions appUrl)
    {
        _db = db;
        _email = email;
        _appUrl = appUrl;
    }

    public async Task SendInviteAsync(User user, CancellationToken ct)
    {
        // Eski aktif davet token'larını iptal et: token doğrulama hash üzerinden tek tek
        // bakar, iptal edilmezse her resend bir çalışan davet linki daha bırakır.
        var now = DateTime.UtcNow;
        var oldTokens = await _db.OneTimeTokens
            .Where(t => t.UserId == user.Id && t.Purpose == TokenPurpose.Invite
                        && !t.IsUsed && t.ExpiresAt > now)
            .ToListAsync(ct);
        foreach (var old in oldTokens)
            old.IsUsed = true;

        var rawToken = TokenGenerator.Generate();
        _db.OneTimeTokens.Add(new OneTimeToken
        {
            // TenantId YOK — iki çağıran da (CreateStaff, resend) tenant bağlamında,
            // interceptor damgalar.
            UserId = user.Id,
            TokenHash = TokenHasher.Hash(rawToken),
            Purpose = TokenPurpose.Invite,
            ExpiresAt = now.Add(InviteLifetime),
        });

        await _db.SaveChangesAsync(ct);

        // E-posta kayıttan SONRA: gönderim patlarsa kayıt durur, davet yeniden gönderilebilir.
        var tenantName = await _db.Tenants.Select(t => t.Name).FirstOrDefaultAsync(ct);
        var link = _appUrl.InviteLink(rawToken);
        await _email.SendAsync(
            user.Email,
            $"{tenantName ?? "Shift"} — ekibe davet edildiniz",
            $"""
            <p>Merhaba {user.FullName},</p>
            <p><strong>{tenantName ?? "İşletmeniz"}</strong> sizi Shift'e davet etti.
            Hesabınızı etkinleştirmek için şifrenizi belirleyin:</p>
            <p><a href="{link}">{link}</a></p>
            <p>Bu bağlantı 7 gün geçerlidir ve tek kullanımlıktır.</p>
            """,
            ct);
    }
}
