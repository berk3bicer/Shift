using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Services;
using Shift.Application.Features.Shifts.Update;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

public class UpdateShiftTests
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

    private static async Task<Guid> SeedShiftAsync(
        ShiftDbContext db, Guid branchId, Guid positionId, Guid? userId,
        DateTime start, DateTime end)
    {
        var shift = new ShiftEntity
        {
            BranchId = branchId,
            PositionId = positionId,
            UserId = userId,
            StartTime = start,
            EndTime = end,
            Status = ShiftStatus.Draft
        };
        db.Shifts.Add(shift);
        await db.SaveChangesAsync();
        return shift.Id;
    }

    private static DateTime D(int day, int hour) =>
        new DateTime(2026, 7, day, hour, 0, 0, DateTimeKind.Utc);

    // ── Vardiyayı kendi saatlerine yakın güncelleme KENDİSİYLE çakışmamalı ──
    [Fact]
    public async Task Update_Kendisiyle_Cakismaz()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        var shiftId = await SeedShiftAsync(db, branchId, positionId, userId, D(5, 9), D(5, 13));

        var handler = new UpdateShiftHandler(db, new ShiftRuleChecker(db));
        // 09-13 → 10-14 (kendi eski haline biniyor ama kendini dışlamalı)
        var cmd = new UpdateShiftCommand(shiftId, positionId, userId, D(5, 10), D(5, 14), "kaydirildi");

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.Equal(shiftId, result.ShiftId);
        Assert.Empty(result.Warnings);
    }

    // ── BAŞKA bir vardiyayla çakışma hâlâ yakalanmalı ──
    [Fact]
    public async Task Update_Baskasiyla_Cakisinca_Hata()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // İki vardiya: A (09-13) güncellenecek, B (15-19) sabit
        var shiftA = await SeedShiftAsync(db, branchId, positionId, userId, D(5, 9), D(5, 13));
        await SeedShiftAsync(db, branchId, positionId, userId, D(5, 15), D(5, 19));

        var handler = new UpdateShiftHandler(db, new ShiftRuleChecker(db));
        // A'yı 14-17'ye taşı → B (15-19) ile çakışır
        var cmd = new UpdateShiftCommand(shiftA, positionId, userId, D(5, 14), D(5, 17), null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(cmd, CancellationToken.None));
    }

    // ── Olmayan vardiya güncellenince hata ──
    [Fact]
    public async Task Update_Olmayan_Vardiya_Hata()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        var handler = new UpdateShiftHandler(db, new ShiftRuleChecker(db));
        var cmd = new UpdateShiftCommand(Guid.NewGuid(), positionId, userId, D(5, 9), D(5, 13), null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(cmd, CancellationToken.None));
    }
}