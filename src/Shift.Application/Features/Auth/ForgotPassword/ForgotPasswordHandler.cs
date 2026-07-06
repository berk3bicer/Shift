using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Security;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Auth.ForgotPassword;

// E-posta kayıtlıysa reset token üret + link gönder; değilse SESSİZCE bitir.
// İki yol da aynı cevabı verir (enumeration koruması).
public class ForgotPasswordHandler : IRequestHandler<ForgotPasswordCommand>
{
    // Reset linki 1 saat geçerli — davetten (7 gün) kısa: talep anlıktır, pencere dar olmalı.
    private static readonly TimeSpan ResetLifetime = TimeSpan.FromHours(1);

    private readonly IShiftDbContext _db;
    private readonly IEmailSender _email;
    private readonly AppUrlOptions _appUrl;

    public ForgotPasswordHandler(IShiftDbContext db, IEmailSender email, AppUrlOptions appUrl)
    {
        _db = db;
        _email = email;
        _appUrl = appUrl;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        // Anonim uç: tenant context yok → global ara (login deseni).
        var user = await _db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        if (user is null)
            return; // sessiz: cevap "varsa gönderildi"den farklılaşmaz

        var rawToken = TokenGenerator.Generate();
        _db.OneTimeTokens.Add(new OneTimeToken
        {
            // Anonim istekte interceptor damgalayamaz → tenant'ı user'dan al (LoginHandler deseni).
            TenantId = user.TenantId,
            UserId = user.Id,
            TokenHash = TokenHasher.Hash(rawToken),
            Purpose = TokenPurpose.PasswordReset,
            ExpiresAt = DateTime.UtcNow.Add(ResetLifetime),
        });
        await _db.SaveChangesAsync(ct);

        var link = _appUrl.PasswordResetLink(rawToken);
        await _email.SendAsync(
            user.Email,
            "Shift — şifre sıfırlama",
            $"""
            <p>Merhaba {user.FullName},</p>
            <p>Şifrenizi sıfırlamak için bağlantıya tıklayın:</p>
            <p><a href="{link}">{link}</a></p>
            <p>Bu bağlantı 1 saat geçerlidir ve tek kullanımlıktır.
            Talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
            """,
            ct);
    }
}
