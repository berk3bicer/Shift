using Microsoft.EntityFrameworkCore;
using Shift.Application.Common;
using Shift.Application.Features.Auth.AcceptInvite;
using Shift.Application.Features.Auth.Login;
using Shift.Application.Features.Staff.Create;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Davet kabulü: geçerli token şifreyi koyar + kullanıcıyı aktifleştirir + token'ı tüketir.
// Login regresyonu: davet bekleyen (pasif) giremez, kabul edince girer.
public class AcceptInviteTests
{
    private static async Task<(ShiftDbContext db, string rawToken, Guid userId)> SetupInvitedAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        db.Roles.Add(new Role { Id = Guid.NewGuid(), Type = RoleType.Staff, Name = "Personel" });
        var branch = new Branch { TenantId = tenantId, Name = "Kadıköy" };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        // Gerçek davet akışıyla kur: handler token üretir, "e-postadan" ham token'ı alırız.
        var email = new FakeEmailSender();
        var created = await new CreateStaffHandler(db, email, new AppUrlOptions("http://localhost:3000"))
            .Handle(new CreateStaffCommand("Ali Vural", "ali@kafe.com", RoleType.Staff, branch.Id, null),
                CancellationToken.None);
        var rawToken = CreateStaffTests.ExtractToken(email.Sent.Single().HtmlBody, "davet");
        return (db, rawToken, created.UserId);
    }

    // ── 1) Geçerli token: şifre set + aktif + token tüketildi ──
    [Fact]
    public async Task Gecerli_Token_Sifre_Koyar_Aktiflestirir_Tuketir()
    {
        var (db, rawToken, userId) = await SetupInvitedAsync();

        var result = await new AcceptInviteHandler(db).Handle(
            new AcceptInviteCommand(rawToken, "YeniSifre1"), CancellationToken.None);

        Assert.Equal("ali@kafe.com", result.Email); // FE login formunu doldurabilsin
        var user = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.Id == userId);
        Assert.True(user.IsActive);
        Assert.True(BCrypt.Net.BCrypt.Verify("YeniSifre1", user.PasswordHash));
        Assert.True((await db.OneTimeTokens.IgnoreQueryFilters().SingleAsync(t => t.UserId == userId)).IsUsed);
    }

    // ── 2) Aynı token ikinci kez → reddedilir (tek kullanım) ──
    [Fact]
    public async Task Kullanilmis_Token_Reddedilir()
    {
        var (db, rawToken, _) = await SetupInvitedAsync();
        await new AcceptInviteHandler(db).Handle(
            new AcceptInviteCommand(rawToken, "YeniSifre1"), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new AcceptInviteHandler(db).Handle(
                new AcceptInviteCommand(rawToken, "BaskaSifre2"), CancellationToken.None));
    }

    // ── 3) Süresi dolmuş token → reddedilir ──
    [Fact]
    public async Task Suresi_Dolmus_Token_Reddedilir()
    {
        var (db, rawToken, userId) = await SetupInvitedAsync();
        var token = await db.OneTimeTokens.IgnoreQueryFilters().SingleAsync(t => t.UserId == userId);
        token.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new AcceptInviteHandler(db).Handle(
                new AcceptInviteCommand(rawToken, "YeniSifre1"), CancellationToken.None));
    }

    // ── 4) Uydurma token → reddedilir ──
    [Fact]
    public async Task Olmayan_Token_Reddedilir()
    {
        var (db, _, _) = await SetupInvitedAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new AcceptInviteHandler(db).Handle(
                new AcceptInviteCommand(new string('a', 64), "YeniSifre1"), CancellationToken.None));
    }

    // ── 5) Login regresyonu: davet bekleyen giremez → kabul edince girer ──
    [Fact]
    public async Task Davet_Bekleyen_Giremez_Kabul_Edince_Girer()
    {
        var (db, rawToken, _) = await SetupInvitedAsync();
        var login = new LoginHandler(db, new FakeJwtTokenGenerator());

        // Pasif + şifresiz: giriş kapalı (boş şifreyle bile).
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            login.Handle(new LoginCommand("ali@kafe.com", ""), CancellationToken.None));

        await new AcceptInviteHandler(db).Handle(
            new AcceptInviteCommand(rawToken, "YeniSifre1"), CancellationToken.None);

        var result = await login.Handle(
            new LoginCommand("ali@kafe.com", "YeniSifre1"), CancellationToken.None);
        Assert.NotNull(result.Token); // artık giriş açık
    }
}
