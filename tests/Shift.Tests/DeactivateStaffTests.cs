using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Staff.Deactivate;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Pasifleştirme, silme DEĞİL: User FK ile vardiya/puantaj/mesai kayıtlarına bağlı,
// silmek bordro geçmişini bozar. IsActive=false login'i keser, geçmişi korur.
// Guard'lar: kendini pasifleştirme yasak, zaten-pasif 400, son aktif Owner korunur.
public class DeactivateStaffTests
{
    private static async Task<(ShiftDbContext db, FakeCurrentUserProvider currentUser,
        User owner, User staff, string dbName)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var db = new ShiftDbContext(
            new DbContextOptionsBuilder<ShiftDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options,
            new FakeTenantProvider { CurrentTenantId = tenantId });

        var ownerRole = new Role { Id = Guid.NewGuid(), Type = RoleType.Owner, Name = "Sahip" };
        var staffRole = new Role { Id = Guid.NewGuid(), Type = RoleType.Staff, Name = "Personel" };
        db.Roles.AddRange(ownerRole, staffRole);

        var owner = new User
        {
            FullName = "Berke Sahip", Email = "sahip@kafe.com",
            PasswordHash = "hash", IsActive = true,
        };
        var staff = new User
        {
            FullName = "Ali Vural", Email = "ali@kafe.com",
            PasswordHash = "hash", IsActive = true, // daveti kabul etmiş, aktif personel
        };
        db.Users.AddRange(owner, staff);
        db.UserRoles.Add(new UserRole { UserId = owner.Id, RoleId = ownerRole.Id });
        db.UserRoles.Add(new UserRole { UserId = staff.Id, RoleId = staffRole.Id });
        await db.SaveChangesAsync();

        // Varsayılan çağıran: işletme sahibi (kendisi DEĞİL başkasını pasifleştiriyor).
        var currentUser = new FakeCurrentUserProvider { CurrentUserId = owner.Id };
        return (db, currentUser, owner, staff, dbName);
    }

    // ── 1) Aktif personel pasifleşir; kayıt silinmez, DB'de durur ──
    [Fact]
    public async Task Aktif_Personel_Pasiflesir_Kayit_Silinmez()
    {
        var (db, currentUser, _, staff, _) = await SetupAsync();

        await new DeactivateStaffHandler(db, currentUser)
            .Handle(new DeactivateStaffCommand(staff.Id), CancellationToken.None);

        var saved = await db.Users.FirstOrDefaultAsync(u => u.Id == staff.Id);
        Assert.NotNull(saved);          // silinmedi
        Assert.False(saved.IsActive);   // ama pasif
    }

    // ── 2) Kendini pasifleştirme engeli: hesap kilitleme/kurtarma derdini baştan kapat ──
    [Fact]
    public async Task Kendini_Pasiflestirme_Reddedilir()
    {
        var (db, currentUser, _, staff, _) = await SetupAsync();
        currentUser.CurrentUserId = staff.Id; // kendi hesabını hedefliyor

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new DeactivateStaffHandler(db, currentUser)
                .Handle(new DeactivateStaffCommand(staff.Id), CancellationToken.None));
    }

    // ── 3) Zaten pasif → 400 (idempotent değil: yanlış id / çift tık dürüstçe reddedilir) ──
    [Fact]
    public async Task Zaten_Pasif_Ikinci_Cagri_Reddedilir()
    {
        var (db, currentUser, _, staff, _) = await SetupAsync();
        var handler = new DeactivateStaffHandler(db, currentUser);
        await handler.Handle(new DeactivateStaffCommand(staff.Id), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new DeactivateStaffCommand(staff.Id), CancellationToken.None));
    }

    // ── 4) Başka tenant'ın personeli → bulunamaz (global filtre izolasyonu / IDOR) ──
    [Fact]
    public async Task Baska_Tenantin_Personeli_Bulunamaz()
    {
        var (_, currentUser, _, staff, dbName) = await SetupAsync();

        // AYNI store'a başka tenant'ın gözünden bak — kullanıcı DB'de var ama görünmemeli.
        var otherDb = new ShiftDbContext(
            new DbContextOptionsBuilder<ShiftDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options,
            new FakeTenantProvider { CurrentTenantId = Guid.NewGuid() });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            new DeactivateStaffHandler(otherDb, currentUser)
                .Handle(new DeactivateStaffCommand(staff.Id), CancellationToken.None));
    }

    // ── 5) Son aktif Owner pasifleştirilemez: işletme sahipsiz kalır ──
    [Fact]
    public async Task Son_Aktif_Owner_Pasiflestirilemez()
    {
        var (db, currentUser, owner, staff, _) = await SetupAsync();
        currentUser.CurrentUserId = staff.Id; // çağıran owner'ın kendisi olmasın (guard #2 değil #4 test ediliyor)

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new DeactivateStaffHandler(db, currentUser)
                .Handle(new DeactivateStaffCommand(owner.Id), CancellationToken.None));

        Assert.Contains("sahip", ex.Message); // son-owner mesajı (zaten-pasif değil)
        Assert.True((await db.Users.FirstAsync(u => u.Id == owner.Id)).IsActive);
    }

    // ── 6) Başka AKTİF Owner varken Owner pasifleştirilebilir ──
    [Fact]
    public async Task Ikinci_Aktif_Owner_Varken_Owner_Pasiflesir()
    {
        var (db, currentUser, owner, _, _) = await SetupAsync();
        var ownerRole = await db.Roles.FirstAsync(r => r.Type == RoleType.Owner);
        var owner2 = new User
        {
            FullName = "Ortak Sahip", Email = "ortak@kafe.com",
            PasswordHash = "hash", IsActive = true,
        };
        db.Users.Add(owner2);
        db.UserRoles.Add(new UserRole { UserId = owner2.Id, RoleId = ownerRole.Id });
        await db.SaveChangesAsync();
        currentUser.CurrentUserId = owner2.Id; // ortak, diğer sahibi pasifleştiriyor

        await new DeactivateStaffHandler(db, currentUser)
            .Handle(new DeactivateStaffCommand(owner.Id), CancellationToken.None);

        Assert.False((await db.Users.FirstAsync(u => u.Id == owner.Id)).IsActive);
    }

    // ── 7) Geçmiş korunur: pasifleştirme user'a bağlı puantaj kaydını SİLMEZ ──
    [Fact]
    public async Task Pasiflestirme_Puantaj_Gecmisini_Korur()
    {
        var (db, currentUser, _, staff, _) = await SetupAsync();
        var branch = new Branch { Name = "Kadıköy" };
        db.Branches.Add(branch);
        db.TimeClocks.Add(new TimeClock
        {
            UserId = staff.Id,
            BranchId = branch.Id,
            CheckInTime = DateTime.UtcNow.AddHours(-9),
            CheckOutTime = DateTime.UtcNow.AddHours(-1),
        });
        await db.SaveChangesAsync();

        await new DeactivateStaffHandler(db, currentUser)
            .Handle(new DeactivateStaffCommand(staff.Id), CancellationToken.None);

        // Bordro geçmişi yerinde: pasif kullanıcının puantajı hâlâ sorgulanabilir.
        Assert.Equal(1, await db.TimeClocks.CountAsync(tc => tc.UserId == staff.Id));
    }
}
