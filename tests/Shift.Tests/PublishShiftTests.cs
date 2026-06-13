using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Shifts.PublishShift;
using Shift.Application.Features.Shifts.PublishWeek;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

// Vardiya yayınlama (tek + toplu) ve bildirim üretimi.
public class PublishShiftTests
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

    private static ShiftEntity Draft(Guid branchId, Guid positionId, Guid? userId, DateTime start) =>
        new ShiftEntity
        {
            BranchId = branchId,
            PositionId = positionId,
            UserId = userId,
            StartTime = start,
            EndTime = start.AddHours(4),
            Status = ShiftStatus.Draft
        };

    // ── Tek vardiya publish: Draft → Published + atanmışsa bildirim ──
    [Fact]
    public async Task Tek_Vardiya_Publish_Bildirim_Uretir()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        var shift = Draft(branchId, positionId, userId, new DateTime(2026, 9, 7, 9, 0, 0, DateTimeKind.Utc));
        db.Shifts.Add(shift);
        await db.SaveChangesAsync();

        var handler = new PublishShiftHandler(db);
        var result = await handler.Handle(new PublishShiftCommand(shift.Id), CancellationToken.None);

        Assert.Equal("Published", result.Status);
        var saved = await db.Shifts.FirstAsync(s => s.Id == shift.Id);
        Assert.Equal(ShiftStatus.Published, saved.Status);
        // Atanmış personele 1 bildirim
        Assert.Equal(1, await db.Notifications.CountAsync(n => n.UserId == userId));
    }

    // ── Zaten Published vardiya tekrar publish edilemez (state machine) ──
    [Fact]
    public async Task Yayindaki_Vardiya_Tekrar_Publish_Edilemez()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        var shift = Draft(branchId, positionId, userId, new DateTime(2026, 9, 7, 9, 0, 0, DateTimeKind.Utc));
        db.Shifts.Add(shift);
        await db.SaveChangesAsync();

        var handler = new PublishShiftHandler(db);
        await handler.Handle(new PublishShiftCommand(shift.Id), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new PublishShiftCommand(shift.Id), CancellationToken.None));
    }

    // ── Açık vardiya (UserId null) publish: durum değişir ama bildirim YOK ──
    [Fact]
    public async Task Acik_Vardiya_Publish_Bildirim_Uretmez()
    {
        var (db, branchId, positionId, _) = await SetupAsync();
        var shift = Draft(branchId, positionId, null, new DateTime(2026, 9, 7, 9, 0, 0, DateTimeKind.Utc));
        db.Shifts.Add(shift);
        await db.SaveChangesAsync();

        var handler = new PublishShiftHandler(db);
        await handler.Handle(new PublishShiftCommand(shift.Id), CancellationToken.None);

        Assert.Equal(0, await db.Notifications.CountAsync());
    }

    // ── Toplu publish: aynı personelin iki vardiyası → tek özet bildirim ──
    [Fact]
    public async Task Toplu_Publish_Tek_Personele_Tek_Bildirim()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // Aynı personele iki Draft vardiya (aynı hafta)
        db.Shifts.AddRange(
            Draft(branchId, positionId, userId, new DateTime(2026, 9, 7, 9, 0, 0, DateTimeKind.Utc)),
            Draft(branchId, positionId, userId, new DateTime(2026, 9, 8, 9, 0, 0, DateTimeKind.Utc))
        );
        await db.SaveChangesAsync();

        var handler = new PublishWeekHandler(db);
        var result = await handler.Handle(
            new PublishWeekCommand(branchId,
                new DateTime(2026, 9, 7, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc)),
            CancellationToken.None);

        Assert.Equal(2, result.PublishedCount);      // iki vardiya yayınlandı
        Assert.Equal(1, result.NotifiedUserCount);   // ama tek personel
        // Distinct: iki vardiya ama tek bildirim
        Assert.Equal(1, await db.Notifications.CountAsync(n => n.UserId == userId));
    }
}