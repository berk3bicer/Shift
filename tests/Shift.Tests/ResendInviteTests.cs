using Microsoft.EntityFrameworkCore;
using Shift.Application.Common;
using Shift.Application.Common.Services;
using Shift.Application.Features.Auth.AcceptInvite;
using Shift.Application.Features.Staff.Create;
using Shift.Application.Features.Staff.ResendInvite;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Daveti tekrar gönder: yeni token üretilir, ESKİ aktif token'lar iptal edilir
// (yoksa her resend bir çalışan davet linki daha bırakır). Aktif kullanıcıya resend
// reddedilir — accept-invite şifreyi sıfırdan koyduğu için hesap ele geçirme kapısı olur.
public class ResendInviteTests
{
    private static async Task<(ShiftDbContext db, FakeEmailSender email, Guid userId, string dbName)> SetupInvitedAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        db.Roles.Add(new Role { Id = Guid.NewGuid(), Type = RoleType.Staff, Name = "Personel" });
        var branch = new Branch { TenantId = tenantId, Name = "Kadıköy" };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        // Gerçek davet akışıyla kur: davet-bekleyen (pasif) kullanıcı + ilk token.
        var email = new FakeEmailSender();
        var created = await new CreateStaffHandler(db,
                new InvitationService(db, email, new AppUrlOptions("http://localhost:3000")))
            .Handle(new CreateStaffCommand("Ali Vural", "ali@kafe.com", RoleType.Staff, branch.Id, null),
                CancellationToken.None);
        return (db, email, created.UserId, dbName);
    }

    private static ResendInviteHandler Handler(ShiftDbContext db, FakeEmailSender email) =>
        new(db, new InvitationService(db, email, new AppUrlOptions("http://localhost:3000")));

    // ── 1) Pasif kullanıcıya resend: yeni token + eskiler iptal + e-posta gitti ──
    [Fact]
    public async Task Pasif_Kullaniciya_Resend_Yeni_Token_Eskiyi_Iptal_Eder()
    {
        var (db, email, userId, _) = await SetupInvitedAsync();

        await Handler(db, email).Handle(new ResendInviteCommand(userId), CancellationToken.None);

        var tokens = await db.OneTimeTokens.Where(t => t.UserId == userId).ToListAsync();
        Assert.Equal(2, tokens.Count);                       // ilk davet + resend
        Assert.Single(tokens, t => t.IsActive);              // yalnız YENİ token tüketilebilir
        Assert.Equal(2, email.Sent.Count);                   // ilk davet + resend e-postası
        Assert.Equal("ali@kafe.com", email.Sent[1].To);
    }

    // ── 2) İki resend: yalnız SON link çalışır, öncekiler reddedilir (uçtan uca) ──
    [Fact]
    public async Task Iki_Resend_Yalniz_Son_Link_Calisir()
    {
        var (db, email, userId, _) = await SetupInvitedAsync();
        var handler = Handler(db, email);

        await handler.Handle(new ResendInviteCommand(userId), CancellationToken.None);
        await handler.Handle(new ResendInviteCommand(userId), CancellationToken.None);

        // E-postalardan ham token'ları sök: [0]=ilk davet, [1]=resend1, [2]=resend2.
        var raw = email.Sent
            .Select(s => CreateStaffTests.ExtractToken(s.HtmlBody, "davet"))
            .ToList();
        var accept = new AcceptInviteHandler(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            accept.Handle(new AcceptInviteCommand(raw[0], "YeniSifre1"), CancellationToken.None));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            accept.Handle(new AcceptInviteCommand(raw[1], "YeniSifre1"), CancellationToken.None));

        var result = await accept.Handle(
            new AcceptInviteCommand(raw[2], "YeniSifre1"), CancellationToken.None);
        Assert.Equal("ali@kafe.com", result.Email);
        Assert.True((await db.Users.FirstAsync(u => u.Id == userId)).IsActive);
    }

    // ── 3) Aktif kullanıcıya resend → reddedilir, token üretilmez, e-posta gitmez ──
    [Fact]
    public async Task Aktif_Kullaniciya_Resend_Reddedilir()
    {
        var (db, email, userId, _) = await SetupInvitedAsync();
        var user = await db.Users.FirstAsync(u => u.Id == userId);
        user.IsActive = true; // daveti kabul etmiş gibi
        await db.SaveChangesAsync();
        var before = await db.OneTimeTokens.CountAsync(t => t.UserId == userId);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Handler(db, email).Handle(new ResendInviteCommand(userId), CancellationToken.None));

        Assert.Equal(before, await db.OneTimeTokens.CountAsync(t => t.UserId == userId));
        Assert.Single(email.Sent); // yalnız ilk davet e-postası — resend gitmedi
    }

    // ── 4) Başka tenant'ın kullanıcısı → bulunamaz (global filtre izolasyonu) ──
    [Fact]
    public async Task Baska_Tenantin_Kullanicisina_Resend_Bulunamaz()
    {
        var (_, email, userId, dbName) = await SetupInvitedAsync();

        // AYNI store'a (aynı dbName) başka tenant'ın gözünden bak — kullanıcı DB'de var
        // ama global filtre görünmez kılmalı.
        var otherDb = new ShiftDbContext(
            new DbContextOptionsBuilder<ShiftDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options,
            new FakeTenantProvider { CurrentTenantId = Guid.NewGuid() });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            Handler(otherDb, email).Handle(new ResendInviteCommand(userId), CancellationToken.None));
    }
}
