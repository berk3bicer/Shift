using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common;
using Shift.Application.Common.Security;
using Shift.Application.Common.Services;
using Shift.Application.Features.Staff.Create;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Personel ekleme = DAVET: User IsActive=false + şifresiz açılır, davet token'ının
// HASH'i saklanır, ham token yalnız e-postadaki linkte yaşar. Register'dan farkı:
// yeni tenant açmaz.
public class CreateStaffTests
{
    private static async Task<(ShiftDbContext db, Guid tenantId, Guid branchId)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        // Roller global seed (gerçek seed'le aynı Type'lar).
        db.Roles.AddRange(
            new Role { Id = Guid.NewGuid(), Type = RoleType.Manager, Name = "Yönetici" },
            new Role { Id = Guid.NewGuid(), Type = RoleType.Staff, Name = "Personel" });
        var branch = new Branch { TenantId = tenantId, Name = "Kadıköy" };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();
        return (db, tenantId, branch.Id);
    }

    private static CreateStaffHandler Handler(ShiftDbContext db, FakeEmailSender email) =>
        new(db, new InvitationService(db, email, new AppUrlOptions("http://localhost:3000")));

    // E-postadaki davet linkinden ham token'ı söker (testin "personel" tarafı).
    internal static string ExtractToken(string htmlBody, string path)
    {
        var match = Regex.Match(htmlBody, $"/{path}/([0-9a-f]+)");
        Assert.True(match.Success, $"E-posta gövdesinde /{path}/ linki yok.");
        return match.Groups[1].Value;
    }

    // ── 1) Davet edilir: IsActive=false, şifresiz, rol+şube bağlı, tenant damgalı ──
    [Fact]
    public async Task Personel_Davet_Edilir_Pasif_Ve_Sifresiz()
    {
        var (db, tenantId, branchId) = await SetupAsync();
        var position = new Position { TenantId = tenantId, Name = "Barista", HourlyRate = 90 };
        db.Positions.Add(position);
        await db.SaveChangesAsync();
        var email = new FakeEmailSender();

        var result = await Handler(db, email).Handle(
            new CreateStaffCommand("Ayşe Yılmaz", "ayse@kafe.com",
                RoleType.Staff, branchId, position.Id),
            CancellationToken.None);

        var user = await db.Users.FirstAsync(u => u.Id == result.UserId);
        Assert.Equal(tenantId, user.TenantId);                       // interceptor damgaladı
        Assert.Equal(position.Id, user.PositionId);
        Assert.False(user.IsActive);                                 // davet bekliyor → login kapalı
        Assert.Equal(string.Empty, user.PasswordHash);               // şifreyi yönetici DEĞİL personel koyar
        Assert.True(await db.UserRoles.AnyAsync(ur => ur.UserId == user.Id));
        Assert.True(await db.UserBranches.AnyAsync(ub => ub.UserId == user.Id && ub.BranchId == branchId));
    }

    // ── 2) Davet token'ı: DB'de HASH, ham token yalnız e-postada; ikisi eşleşir ──
    [Fact]
    public async Task Davet_Tokeni_Hashli_Saklanir_Ham_Token_Epostada()
    {
        var (db, _, branchId) = await SetupAsync();
        var email = new FakeEmailSender();

        var result = await Handler(db, email).Handle(
            new CreateStaffCommand("Mehmet Demir", "mehmet@kafe.com",
                RoleType.Staff, branchId, null),
            CancellationToken.None);

        var token = await db.OneTimeTokens.SingleAsync(t => t.UserId == result.UserId);
        Assert.Equal(TokenPurpose.Invite, token.Purpose);
        Assert.False(token.IsUsed);
        Assert.True(token.ExpiresAt > DateTime.UtcNow.AddDays(6)); // ~7 gün pencere

        var sent = Assert.Single(email.Sent);
        Assert.Equal("mehmet@kafe.com", sent.To);
        var rawToken = ExtractToken(sent.HtmlBody, "davet");
        Assert.NotEqual(rawToken, token.TokenHash);                  // ham token DB'de YOK
        Assert.Equal(TokenHasher.Hash(rawToken), token.TokenHash);   // saklanan = hash'i
    }

    // ── 3) Yeni tenant AÇMAZ (Register'dan fark) ──
    [Fact]
    public async Task Yeni_Tenant_Acmaz()
    {
        var (db, _, branchId) = await SetupAsync();
        var before = await db.Tenants.IgnoreQueryFilters().CountAsync();

        await Handler(db, new FakeEmailSender()).Handle(
            new CreateStaffCommand("Zeynep Kaya", "zeynep@kafe.com",
                RoleType.Staff, branchId, null),
            CancellationToken.None);

        Assert.Equal(before, await db.Tenants.IgnoreQueryFilters().CountAsync());
    }

    // ── 4) Aynı e-posta (global) ikinci kez → reddedilir ──
    [Fact]
    public async Task Ayni_Eposta_Reddedilir()
    {
        var (db, _, branchId) = await SetupAsync();
        var cmd = new CreateStaffCommand("Zeynep Kaya", "zeynep@kafe.com",
            RoleType.Staff, branchId, null);
        await Handler(db, new FakeEmailSender()).Handle(cmd, CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Handler(db, new FakeEmailSender()).Handle(cmd, CancellationToken.None));
    }

    // ── 5) Geçersiz şube → reddedilir, e-posta da GİTMEZ ──
    [Fact]
    public async Task Gecersiz_Sube_Reddedilir()
    {
        var (db, _, _) = await SetupAsync();
        var email = new FakeEmailSender();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Handler(db, email).Handle(
                new CreateStaffCommand("Can Öztürk", "can@kafe.com",
                    RoleType.Staff, Guid.NewGuid(), null),
                CancellationToken.None));

        Assert.Empty(email.Sent);
    }
}
