using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Services;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Onaylı izin kontrolünün ShiftRuleChecker'a entegrasyonu.
public class TimeOffRuleTests
{
    private static async Task<(ShiftDbContext db, Guid userId)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var user = new User { TenantId = tenantId, FullName = "Personel", Email = "p@x.com", PasswordHash = "x" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return (db, user.Id);
    }

    private static async Task SeedLeaveAsync(
        ShiftDbContext db, Guid userId, DateOnly start, DateOnly end, TimeOffStatus status)
    {
        db.TimeOffRequests.Add(new TimeOffRequest
        {
            UserId = userId,
            StartDate = start,
            EndDate = end,
            Type = TimeOffType.AnnualPaid,
            Status = status
        });
        await db.SaveChangesAsync();
    }

    // Vardiya zamanı: 15 Temmuz 2026, 09:00–14:00
    private static DateTime ShiftStart => new DateTime(2026, 7, 15, 9, 0, 0, DateTimeKind.Utc);
    private static DateTime ShiftEnd => new DateTime(2026, 7, 15, 14, 0, 0, DateTimeKind.Utc);

    // ── Onaylı iznin içindeki güne vardiya → uyarı ──
    [Fact]
    public async Task Onayli_Izin_Gununde_Uyari()
    {
        var (db, userId) = await SetupAsync();
        // 14–20 Temmuz onaylı izin; vardiya 15 Temmuz → izin aralığında
        await SeedLeaveAsync(db, userId, new DateOnly(2026, 7, 14), new DateOnly(2026, 7, 20),
            TimeOffStatus.Approved);

        var checker = new ShiftRuleChecker(db);
        var warnings = await checker.CheckAsync(userId, ShiftStart, ShiftEnd, null, CancellationToken.None);

        Assert.Contains(warnings, w => w.Contains("onaylı izinde"));
    }

    // ── Bekleyen (Pending) izin → uyarı YOK (henüz taahhüt değil) ──
    [Fact]
    public async Task Bekleyen_Izin_Uyari_Yok()
    {
        var (db, userId) = await SetupAsync();
        await SeedLeaveAsync(db, userId, new DateOnly(2026, 7, 14), new DateOnly(2026, 7, 20),
            TimeOffStatus.Pending);

        var checker = new ShiftRuleChecker(db);
        var warnings = await checker.CheckAsync(userId, ShiftStart, ShiftEnd, null, CancellationToken.None);

        Assert.DoesNotContain(warnings, w => w.Contains("onaylı izinde"));
    }

    // ── İzin aralığı dışındaki güne vardiya → uyarı YOK ──
    [Fact]
    public async Task Izin_Disinda_Uyari_Yok()
    {
        var (db, userId) = await SetupAsync();
        // 1–5 Temmuz onaylı izin; vardiya 15 Temmuz → aralık dışında
        await SeedLeaveAsync(db, userId, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 5),
            TimeOffStatus.Approved);

        var checker = new ShiftRuleChecker(db);
        var warnings = await checker.CheckAsync(userId, ShiftStart, ShiftEnd, null, CancellationToken.None);

        Assert.DoesNotContain(warnings, w => w.Contains("onaylı izinde"));
    }
}