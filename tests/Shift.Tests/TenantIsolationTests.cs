using Microsoft.EntityFrameworkCore;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

public class TenantIsolationTests
{
    // Her test için taze bir in-memory DbContext + fake provider üret
    private static (ShiftDbContext db, FakeTenantProvider tenant) CreateContext(string dbName)
    {
        var tenantProvider = new FakeTenantProvider();

        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var db = new ShiftDbContext(options, tenantProvider);
        return (db, tenantProvider);
    }

    [Fact]
    public async Task Tenant_Sadece_Kendi_Kullanicisini_Gorur()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        // --- Hazırlık: iki tenant, ikişer kullanıcı yaz ---
        {
            var (db, tenant) = CreateContext(dbName);

            // Tenant A bağlamında A'nın kullanıcısını ekle
            tenant.CurrentTenantId = tenantA;
            db.Users.Add(new User { TenantId = tenantA, FullName = "A-User", Email = "a@x.com", PasswordHash = "x" });
            await db.SaveChangesAsync();

            // Tenant B bağlamında B'nin kullanıcısını ekle
            tenant.CurrentTenantId = tenantB;
            db.Users.Add(new User { TenantId = tenantB, FullName = "B-User", Email = "b@x.com", PasswordHash = "x" });
            await db.SaveChangesAsync();
        }

        // --- Test: Tenant A bağlamında sorgula ---
        {
            var (db, tenant) = CreateContext(dbName);
            tenant.CurrentTenantId = tenantA;

            var users = await db.Users.ToListAsync();

            // A bağlamında SADECE A'nın kullanıcısı görünmeli
            Assert.Single(users);
            Assert.Equal("A-User", users[0].FullName);
            Assert.Equal(tenantA, users[0].TenantId);
        }
    }

    [Fact]
    public async Task Tenant_Digerinin_Kullanicisini_Sorgulayamaz()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        {
            var (db, tenant) = CreateContext(dbName);
            tenant.CurrentTenantId = tenantB;
            db.Users.Add(new User { TenantId = tenantB, FullName = "B-User", Email = "b@x.com", PasswordHash = "x" });
            await db.SaveChangesAsync();
        }

        // A bağlamında B'nin e-postasını ara -> bulamamalı
        {
            var (db, tenant) = CreateContext(dbName);
            tenant.CurrentTenantId = tenantA;

            var found = await db.Users.FirstOrDefaultAsync(u => u.Email == "b@x.com");

            Assert.Null(found); // filtre yüzünden görünmez
        }
    }
}