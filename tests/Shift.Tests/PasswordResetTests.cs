using Microsoft.EntityFrameworkCore;
using Shift.Application.Common;
using Shift.Application.Features.Auth.ForgotPassword;
using Shift.Application.Features.Auth.ResetPassword;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Şifremi unuttum + sıfırlama: token hash'li ve süreli (+1 saat), tek kullanım.
// Enumeration koruması: olmayan e-posta da sessizce "tamam" — davranış farkı yok.
public class PasswordResetTests
{
    private static async Task<(ShiftDbContext db, User user)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var user = new User
        {
            TenantId = tenantId,
            FullName = "Ayşe Yılmaz",
            Email = "ayse@kafe.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("EskiSifre1"),
            IsActive = true,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return (db, user);
    }

    private static ForgotPasswordHandler Forgot(ShiftDbContext db, FakeEmailSender email) =>
        new(db, email, new AppUrlOptions("http://localhost:3000"));

    // ── 1) Uçtan uca: forgot → e-postadaki linkle reset → yeni şifre geçerli ──
    [Fact]
    public async Task Forgot_Reset_Akisi_Sifreyi_Degistirir()
    {
        var (db, user) = await SetupAsync();
        var email = new FakeEmailSender();

        await Forgot(db, email).Handle(new ForgotPasswordCommand("ayse@kafe.com"), CancellationToken.None);

        var sent = Assert.Single(email.Sent);
        Assert.Equal("ayse@kafe.com", sent.To);
        var rawToken = CreateStaffTests.ExtractToken(sent.HtmlBody, "sifre-sifirla");

        // Token: Reset amaçlı, ~1 saatlik pencere, hash'li saklama.
        var token = await db.OneTimeTokens.IgnoreQueryFilters().SingleAsync(t => t.UserId == user.Id);
        Assert.Equal(TokenPurpose.PasswordReset, token.Purpose);
        Assert.True(token.ExpiresAt <= DateTime.UtcNow.AddHours(1).AddMinutes(1));
        Assert.NotEqual(rawToken, token.TokenHash);

        await new ResetPasswordHandler(db).Handle(
            new ResetPasswordCommand(rawToken, "YepyeniSifre2"), CancellationToken.None);

        var updated = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.Id == user.Id);
        Assert.True(BCrypt.Net.BCrypt.Verify("YepyeniSifre2", updated.PasswordHash));
        Assert.False(BCrypt.Net.BCrypt.Verify("EskiSifre1", updated.PasswordHash));
        Assert.True((await db.OneTimeTokens.IgnoreQueryFilters().SingleAsync(t => t.UserId == user.Id)).IsUsed);
    }

    // ── 2) Olmayan e-posta: hata YOK, e-posta da YOK (enumeration koruması) ──
    [Fact]
    public async Task Olmayan_Eposta_Sessizce_Gecilir()
    {
        var (db, _) = await SetupAsync();
        var email = new FakeEmailSender();

        // Handler fırlatmaz → controller her durumda aynı 200'ü döner.
        await Forgot(db, email).Handle(
            new ForgotPasswordCommand("tanimsiz@kafe.com"), CancellationToken.None);

        Assert.Empty(email.Sent);
        Assert.Empty(await db.OneTimeTokens.IgnoreQueryFilters().ToListAsync());
    }

    // ── 3) Kullanılmış reset token'ı ikinci kez → reddedilir ──
    [Fact]
    public async Task Kullanilmis_Token_Reddedilir()
    {
        var (db, _) = await SetupAsync();
        var email = new FakeEmailSender();
        await Forgot(db, email).Handle(new ForgotPasswordCommand("ayse@kafe.com"), CancellationToken.None);
        var rawToken = CreateStaffTests.ExtractToken(email.Sent.Single().HtmlBody, "sifre-sifirla");

        await new ResetPasswordHandler(db).Handle(
            new ResetPasswordCommand(rawToken, "YepyeniSifre2"), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new ResetPasswordHandler(db).Handle(
                new ResetPasswordCommand(rawToken, "UcuncuSifre3"), CancellationToken.None));
    }

    // ── 4) Süresi dolmuş reset token'ı → reddedilir ──
    [Fact]
    public async Task Suresi_Dolmus_Token_Reddedilir()
    {
        var (db, user) = await SetupAsync();
        var email = new FakeEmailSender();
        await Forgot(db, email).Handle(new ForgotPasswordCommand("ayse@kafe.com"), CancellationToken.None);
        var rawToken = CreateStaffTests.ExtractToken(email.Sent.Single().HtmlBody, "sifre-sifirla");

        var token = await db.OneTimeTokens.IgnoreQueryFilters().SingleAsync(t => t.UserId == user.Id);
        token.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new ResetPasswordHandler(db).Handle(
                new ResetPasswordCommand(rawToken, "YepyeniSifre2"), CancellationToken.None));
    }

    // ── 5) Reset açık oturumları düşürür (refresh token'lar iptal) ──
    [Fact]
    public async Task Reset_Acik_Oturumlari_Iptal_Eder()
    {
        var (db, user) = await SetupAsync();
        db.RefreshTokens.Add(new RefreshToken
        {
            TenantId = user.TenantId,
            UserId = user.Id,
            TokenHash = "oturum-hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        });
        await db.SaveChangesAsync();

        var email = new FakeEmailSender();
        await Forgot(db, email).Handle(new ForgotPasswordCommand("ayse@kafe.com"), CancellationToken.None);
        var rawToken = CreateStaffTests.ExtractToken(email.Sent.Single().HtmlBody, "sifre-sifirla");
        await new ResetPasswordHandler(db).Handle(
            new ResetPasswordCommand(rawToken, "YepyeniSifre2"), CancellationToken.None);

        var session = await db.RefreshTokens.IgnoreQueryFilters().SingleAsync(rt => rt.UserId == user.Id);
        Assert.True(session.IsRevoked); // şifre değişti → eski oturum güvenilmez
    }
}
