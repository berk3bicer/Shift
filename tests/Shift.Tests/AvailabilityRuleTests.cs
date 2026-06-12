using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Services;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

// Müsaitlik kontrolünün ShiftRuleChecker'a entegrasyonu.
public class AvailabilityRuleTests
{
    private static async Task<(ShiftDbContext db, Guid branchId, Guid positionId, Guid userId)>
        SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var branch = new Branch { TenantId = tenantId, Name = "Test Sube" };
        var position = new Position { TenantId = tenantId, Name = "Barista" };
        var user = new User { TenantId = tenantId, FullName = "Personel", Email = "p@x.com", PasswordHash = "x" };
        db.Branches.Add(branch);
        db.Positions.Add(position);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return (db, branch.Id, position.Id, user.Id);
    }

    private static async Task SeedUnavailabilityAsync(
        ShiftDbContext db, Guid userId, DayOfWeek day, TimeOnly start, TimeOnly end, string? reason)
    {
        db.Availabilities.Add(new Availability
        {
            UserId = userId,
            DayOfWeek = day,
            StartTime = start,
            EndTime = end,
            Reason = reason
        });
        await db.SaveChangesAsync();
    }

    // 6 Temmuz 2026 = Pazartesi
    private static DateTime Mon(int hour) =>
        new DateTime(2026, 7, 6, hour, 0, 0, DateTimeKind.Utc);
    private static DateTime Tue(int hour) =>
        new DateTime(2026, 7, 7, hour, 0, 0, DateTimeKind.Utc);

    // ── Müsait olmadığı saatte vardiya → uyarı ──
    [Fact]
    public async Task Musait_Olmadigi_Saatte_Uyari()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        await SeedUnavailabilityAsync(db, userId, DayOfWeek.Monday,
            new TimeOnly(13, 0), new TimeOnly(18, 0), "Okul");

        var checker = new ShiftRuleChecker(db);
        // Pzt 14:00–17:00 → müsaitsizliğin içinde
        var warnings = await checker.CheckAsync(userId, Mon(14), Mon(17), null, CancellationToken.None);

        Assert.Contains(warnings, w => w.Contains("müsait değil"));
    }

    // ── Müsaitsizlikten önceki saatte vardiya → uyarı YOK ──
    [Fact]
    public async Task Cakismayan_Saatte_Uyari_Yok()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        await SeedUnavailabilityAsync(db, userId, DayOfWeek.Monday,
            new TimeOnly(13, 0), new TimeOnly(18, 0), "Okul");

        var checker = new ShiftRuleChecker(db);
        // Pzt 09:00–12:00 → müsaitsizlik 13:00'da başlıyor, çakışmaz
        var warnings = await checker.CheckAsync(userId, Mon(9), Mon(12), null, CancellationToken.None);

        Assert.DoesNotContain(warnings, w => w.Contains("müsait değil"));
    }

    // ── Farklı günde vardiya → uyarı YOK ──
    [Fact]
    public async Task Farkli_Gunde_Uyari_Yok()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        await SeedUnavailabilityAsync(db, userId, DayOfWeek.Monday,
            new TimeOnly(13, 0), new TimeOnly(18, 0), "Okul");

        var checker = new ShiftRuleChecker(db);
        // Salı 14:00–17:00 → müsaitsizlik sadece Pazartesi
        var warnings = await checker.CheckAsync(userId, Tue(14), Tue(17), null, CancellationToken.None);

        Assert.DoesNotContain(warnings, w => w.Contains("müsait değil"));
    }
}