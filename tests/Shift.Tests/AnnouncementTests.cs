using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Announcements.Create;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Duyuru fan-out'u: hedef = şube ∩ rol; gönderen de kapsamdaysa alır (kendi duyurusunu
// kendi zilinde görür). Her hedefe bir AnnouncementPosted bildirimi. Gün 8 altyapısı.
public class AnnouncementTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private ShiftDbContext _db = null!;
    private Guid _branchA, _branchB;
    private Guid _staffRoleId, _managerRoleId;

    private async Task SetupAsync()
    {
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = _tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new ShiftDbContext(options, tenantProvider);

        var branchA = new Branch { TenantId = _tenantId, Name = "Sube A" };
        var branchB = new Branch { TenantId = _tenantId, Name = "Sube B" };
        var staffRole = new Role { Type = RoleType.Staff, Name = "Staff" };
        var managerRole = new Role { Type = RoleType.Manager, Name = "Manager" };
        _db.Branches.AddRange(branchA, branchB);
        _db.Roles.AddRange(staffRole, managerRole);
        await _db.SaveChangesAsync();

        _branchA = branchA.Id; _branchB = branchB.Id;
        _staffRoleId = staffRole.Id; _managerRoleId = managerRole.Id;
    }

    // Rol + (opsiyonel) şube ile bir kullanıcı oluşturur.
    private async Task<Guid> AddUserAsync(Guid roleId, Guid? branchId)
    {
        var user = new User { TenantId = _tenantId, FullName = "U", Email = $"{Guid.NewGuid():N}@x.com", PasswordHash = "x" };
        _db.Users.Add(user);
        _db.UserRoles.Add(new UserRole { TenantId = _tenantId, UserId = user.Id, RoleId = roleId });
        if (branchId is { } b)
            _db.UserBranches.Add(new UserBranch { TenantId = _tenantId, UserId = user.Id, BranchId = b });
        await _db.SaveChangesAsync();
        return user.Id;
    }

    private CreateAnnouncementHandler Handler(Guid senderId)
        => new(_db, new FakeCurrentUserProvider { CurrentUserId = senderId });

    // ── 1) Tüm ekibe (rol/şube yok): gönderen DAHİL herkese bildirim ──
    [Fact]
    public async Task Tum_Ekibe_Gonderen_Dahil_Herkese()
    {
        await SetupAsync();
        var sender = await AddUserAsync(_managerRoleId, _branchA);
        await AddUserAsync(_staffRoleId, _branchA);
        await AddUserAsync(_staffRoleId, _branchB);

        var result = await Handler(sender).Handle(
            new CreateAnnouncementCommand("Baslik", "Metin", null, null), CancellationToken.None);

        Assert.Equal(3, result.RecipientCount);                  // 3 kullanıcı, gönderen dahil
        Assert.Equal(3, await _db.Notifications.CountAsync(n => n.Type == NotificationType.AnnouncementPosted));
        Assert.Equal(1, await _db.Notifications.CountAsync(n => n.UserId == sender));  // gönderen kendi zilinde görür
    }

    // ── 2) Belirli ROLE: yalnız o rol ──
    [Fact]
    public async Task Belirli_Role_Sadece_O_Rol()
    {
        await SetupAsync();
        var sender = await AddUserAsync(_managerRoleId, null);
        var staff1 = await AddUserAsync(_staffRoleId, _branchA);
        var staff2 = await AddUserAsync(_staffRoleId, _branchB);
        await AddUserAsync(_managerRoleId, _branchA);           // başka yönetici

        var result = await Handler(sender).Handle(
            new CreateAnnouncementCommand("B", "M", null, RoleType.Staff), CancellationToken.None);

        Assert.Equal(2, result.RecipientCount);                 // sadece iki Staff
        Assert.Equal(1, await _db.Notifications.CountAsync(n => n.UserId == staff1));
        Assert.Equal(1, await _db.Notifications.CountAsync(n => n.UserId == staff2));
        // Gönderen Manager → Staff kapsamının dışında; kendine bildirim düşmez.
        Assert.Equal(0, await _db.Notifications.CountAsync(n => n.UserId == sender));
    }

    // ── 3) Belirli ŞUBEYE: yalnız o şubedeki kullanıcılar ──
    [Fact]
    public async Task Belirli_Subeye_Sadece_O_Sube()
    {
        await SetupAsync();
        var sender = await AddUserAsync(_managerRoleId, null);
        var aUser = await AddUserAsync(_staffRoleId, _branchA);
        await AddUserAsync(_staffRoleId, _branchB);

        var result = await Handler(sender).Handle(
            new CreateAnnouncementCommand("B", "M", _branchA, null), CancellationToken.None);

        Assert.Equal(1, result.RecipientCount);                 // sadece A şubesi
        Assert.Equal(1, await _db.Notifications.CountAsync(n => n.UserId == aUser));
    }

    // ── 4) ROL + ŞUBE kesişimi ──
    [Fact]
    public async Task Rol_Ve_Sube_Kesisimi()
    {
        await SetupAsync();
        var sender = await AddUserAsync(_managerRoleId, null);
        var staffA = await AddUserAsync(_staffRoleId, _branchA);   // hedef
        await AddUserAsync(_staffRoleId, _branchB);                // yanlış şube
        await AddUserAsync(_managerRoleId, _branchA);              // yanlış rol

        var result = await Handler(sender).Handle(
            new CreateAnnouncementCommand("B", "M", _branchA, RoleType.Staff), CancellationToken.None);

        Assert.Equal(1, result.RecipientCount);                 // sadece A'daki Staff
        Assert.Equal(1, await _db.Notifications.CountAsync(n => n.UserId == staffA));
    }

    // ── 5) Duyuru + bildirim aynı RelatedEntityId ile bağlı ──
    [Fact]
    public async Task Bildirim_Duyuruya_Baglanir()
    {
        await SetupAsync();
        var sender = await AddUserAsync(_managerRoleId, null);
        await AddUserAsync(_staffRoleId, _branchA);

        var result = await Handler(sender).Handle(
            new CreateAnnouncementCommand("Baslik", "Metin", null, RoleType.Staff), CancellationToken.None);

        var notif = await _db.Notifications.FirstAsync(n => n.Type == NotificationType.AnnouncementPosted);
        Assert.Equal(result.AnnouncementId, notif.RelatedEntityId);   // tıkla → duyuruya git
        Assert.Equal("Baslik", notif.Message);
    }
}
