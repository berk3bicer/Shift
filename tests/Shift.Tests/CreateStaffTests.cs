using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Staff.Create;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Personel ekleme: mevcut tenant'a User+UserRole+UserBranch(+pozisyon), BCrypt hash,
// global e-posta tekilliği. Register'dan farkı: yeni tenant açmaz.
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

    // ── 1) Personel eklenir: User+rol+şube, hash doğru, tenant damgalı ──
    [Fact]
    public async Task Personel_Eklenir_Hash_Rol_Sube()
    {
        var (db, tenantId, branchId) = await SetupAsync();
        var position = new Position { TenantId = tenantId, Name = "Barista", HourlyRate = 90 };
        db.Positions.Add(position);
        await db.SaveChangesAsync();

        var result = await new CreateStaffHandler(db).Handle(
            new CreateStaffCommand("Ayşe Yılmaz", "ayse@kafe.com", "Sifre1234",
                RoleType.Staff, branchId, position.Id),
            CancellationToken.None);

        var user = await db.Users.FirstAsync(u => u.Id == result.UserId);
        Assert.Equal(tenantId, user.TenantId);                       // interceptor damgaladı
        Assert.Equal(position.Id, user.PositionId);
        Assert.True(user.IsActive);
        Assert.True(BCrypt.Net.BCrypt.Verify("Sifre1234", user.PasswordHash)); // hash doğru
        Assert.True(await db.UserRoles.AnyAsync(ur => ur.UserId == user.Id));   // rol bağlandı
        Assert.True(await db.UserBranches.AnyAsync(ub => ub.UserId == user.Id && ub.BranchId == branchId));
    }

    // ── 2) Yeni tenant AÇMAZ (Register'dan fark) ──
    [Fact]
    public async Task Yeni_Tenant_Acmaz()
    {
        var (db, _, branchId) = await SetupAsync();
        var before = await db.Tenants.IgnoreQueryFilters().CountAsync();

        await new CreateStaffHandler(db).Handle(
            new CreateStaffCommand("Mehmet Demir", "mehmet@kafe.com", "Sifre1234",
                RoleType.Staff, branchId, null),
            CancellationToken.None);

        Assert.Equal(before, await db.Tenants.IgnoreQueryFilters().CountAsync());
    }

    // ── 3) Aynı e-posta (global) ikinci kez → reddedilir (idempotency sinyali) ──
    [Fact]
    public async Task Ayni_Eposta_Reddedilir()
    {
        var (db, _, branchId) = await SetupAsync();
        var cmd = new CreateStaffCommand("Zeynep Kaya", "zeynep@kafe.com", "Sifre1234",
            RoleType.Staff, branchId, null);
        await new CreateStaffHandler(db).Handle(cmd, CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new CreateStaffHandler(db).Handle(cmd, CancellationToken.None));
    }

    // ── 4) Geçersiz şube → reddedilir ──
    [Fact]
    public async Task Gecersiz_Sube_Reddedilir()
    {
        var (db, _, _) = await SetupAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new CreateStaffHandler(db).Handle(
                new CreateStaffCommand("Can Öztürk", "can@kafe.com", "Sifre1234",
                    RoleType.Staff, Guid.NewGuid(), null),
                CancellationToken.None));
    }
}
