using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Tasks.Create;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Görev oluşturma bildirimleri (CreateTaskHandler): kişiye-atama → o kişiye tek bildirim;
// pozisyona-atama → o pozisyon ∩ görevin şubesindeki HERKESE bildirim (oluşturan hariç,
// şube izolasyonlu).
public class CreateTaskTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private ShiftDbContext _db = null!;
    private Guid _branchA, _branchB;
    private Guid _baristaPosId, _kasiyerPosId;

    private async Task SetupAsync()
    {
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = _tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new ShiftDbContext(options, tenantProvider);

        var branchA = new Branch { TenantId = _tenantId, Name = "Sube A" };
        var branchB = new Branch { TenantId = _tenantId, Name = "Sube B" };
        var barista = new Position { TenantId = _tenantId, Name = "Barista" };
        var kasiyer = new Position { TenantId = _tenantId, Name = "Kasiyer" };
        _db.Branches.AddRange(branchA, branchB);
        _db.Positions.AddRange(barista, kasiyer);
        await _db.SaveChangesAsync();

        _branchA = branchA.Id; _branchB = branchB.Id;
        _baristaPosId = barista.Id; _kasiyerPosId = kasiyer.Id;
    }

    // Pozisyon + şube ile bir kullanıcı oluşturur.
    private async Task<Guid> AddUserAsync(Guid? positionId, Guid? branchId)
    {
        var user = new User
        {
            TenantId = _tenantId, FullName = "U",
            Email = $"{Guid.NewGuid():N}@x.com", PasswordHash = "x",
            PositionId = positionId
        };
        _db.Users.Add(user);
        if (branchId is { } b)
            _db.UserBranches.Add(new UserBranch { TenantId = _tenantId, UserId = user.Id, BranchId = b });
        await _db.SaveChangesAsync();
        return user.Id;
    }

    private CreateTaskHandler Handler(Guid creatorId)
        => new(_db, new FakeCurrentUserProvider { CurrentUserId = creatorId });

    private static CreateTaskCommand Command(Guid branchId, Guid? userId, Guid? positionId)
        => new(branchId, "Makineyi temizle", null, null,
               TaskPriority.Medium, TaskCategory.Cleaning, userId, positionId);

    // ── 1) Pozisyona atama: pozisyon ∩ şubedeki HERKESE bildirim, oluşturan hariç ──
    [Fact]
    public async Task Pozisyona_Atama_Herkese_Bildirim_Olusturan_Haric()
    {
        await SetupAsync();
        var creator = await AddUserAsync(_baristaPosId, _branchA);   // oluşturan da barista — kendine gitmemeli
        var barista1 = await AddUserAsync(_baristaPosId, _branchA);
        var barista2 = await AddUserAsync(_baristaPosId, _branchA);
        await AddUserAsync(_kasiyerPosId, _branchA);                 // yanlış pozisyon

        var result = await Handler(creator).Handle(
            Command(_branchA, null, _baristaPosId), CancellationToken.None);

        var notifs = await _db.Notifications
            .Where(n => n.Type == NotificationType.TaskAssigned).ToListAsync();
        Assert.Equal(2, notifs.Count);
        Assert.Contains(notifs, n => n.UserId == barista1);
        Assert.Contains(notifs, n => n.UserId == barista2);
        Assert.DoesNotContain(notifs, n => n.UserId == creator);     // kendi görevini kendine bildirme
        Assert.All(notifs, n =>
        {
            Assert.Equal("Pozisyonuna bir görev atandı.", n.Message);
            Assert.Equal(result.TaskId, n.RelatedEntityId);          // tıkla → göreve git
        });
    }

    // ── 2) Şube izolasyonu: farklı şubedeki aynı-pozisyon personele bildirim GİTMEZ ──
    [Fact]
    public async Task Pozisyona_Atama_Farkli_Subeye_Gitmez()
    {
        await SetupAsync();
        var creator = await AddUserAsync(null, _branchA);
        var baristaA = await AddUserAsync(_baristaPosId, _branchA);  // hedef
        var baristaB = await AddUserAsync(_baristaPosId, _branchB);  // yanlış şube

        await Handler(creator).Handle(
            Command(_branchA, null, _baristaPosId), CancellationToken.None);

        Assert.Equal(1, await _db.Notifications.CountAsync(n => n.UserId == baristaA));
        Assert.Equal(0, await _db.Notifications.CountAsync(n => n.UserId == baristaB));
    }

    // ── 3) Regresyon: kişiye atama hâlâ o kişiye tek bildirim ──
    [Fact]
    public async Task Kisiye_Atama_Tek_Bildirim()
    {
        await SetupAsync();
        var creator = await AddUserAsync(null, _branchA);
        var staff = await AddUserAsync(_baristaPosId, _branchA);

        var result = await Handler(creator).Handle(
            Command(_branchA, staff, null), CancellationToken.None);

        var notif = Assert.Single(await _db.Notifications.ToListAsync());
        Assert.Equal(staff, notif.UserId);
        Assert.Equal(NotificationType.TaskAssigned, notif.Type);
        Assert.Equal("Sana bir görev atandı.", notif.Message);
        Assert.Equal(result.TaskId, notif.RelatedEntityId);
    }

    // ── 4) Savunma: ikisi de doluysa çift bildirim yok — kişiye-atama kazanır ──
    [Fact]
    public async Task Ikisi_De_Doluysa_Sadece_Kisiye_Bildirim()
    {
        await SetupAsync();
        var creator = await AddUserAsync(null, _branchA);
        var staff = await AddUserAsync(_baristaPosId, _branchA);
        await AddUserAsync(_baristaPosId, _branchA);                 // aynı pozisyonda ikinci kişi

        await Handler(creator).Handle(
            Command(_branchA, staff, _baristaPosId), CancellationToken.None);

        var notif = Assert.Single(await _db.Notifications.ToListAsync());
        Assert.Equal(staff, notif.UserId);
        Assert.Equal("Sana bir görev atandı.", notif.Message);
    }
}
