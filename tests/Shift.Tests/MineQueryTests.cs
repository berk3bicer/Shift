using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Shifts.Mine;
using Shift.Application.Features.Tasks.Mine;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

// Staff self-read uçları: /shifts/mine ve /tasks/mine. Demir kural: yalnızca çağıranın
// kendi verisi döner — başka personelin verisi SIZMAMALI (UserId JWT'den, client'tan değil).
public class MineQueryTests
{
    private static (ShiftDbContext db, Guid ayseId, Guid mehmetId, Guid branchId, Guid positionId)
        Setup()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var branch = new Branch { TenantId = tenantId, Name = "Test Sube" };
        var position = new Position { TenantId = tenantId, Name = "Barista" };
        var ayse = new User { TenantId = tenantId, FullName = "Ayşe", Email = "ayse@x.com", PasswordHash = "x" };
        var mehmet = new User { TenantId = tenantId, FullName = "Mehmet", Email = "mehmet@x.com", PasswordHash = "x" };
        db.Branches.Add(branch);
        db.Positions.Add(position);
        db.Users.AddRange(ayse, mehmet);
        db.SaveChanges();
        return (db, ayse.Id, mehmet.Id, branch.Id, position.Id);
    }

    private static ShiftEntity Shift(Guid branchId, Guid positionId, Guid? userId, DateTime start) =>
        new ShiftEntity
        {
            BranchId = branchId,
            PositionId = positionId,
            UserId = userId,
            StartTime = start,
            EndTime = start.AddHours(8),
            Status = ShiftStatus.Published
        };

    // ── /shifts/mine: yalnızca çağıranın vardiyaları; başkasınınki sızmaz ──
    [Fact]
    public async Task MyShifts_Sadece_Kendi_Vardiyalarini_Dondurur()
    {
        var (db, ayseId, mehmetId, branchId, positionId) = Setup();
        var range = new DateTime(2026, 7, 6, 0, 0, 0, DateTimeKind.Utc);
        db.Shifts.AddRange(
            Shift(branchId, positionId, ayseId, range.AddHours(9)),    // Ayşe
            Shift(branchId, positionId, ayseId, range.AddDays(1).AddHours(9)), // Ayşe
            Shift(branchId, positionId, mehmetId, range.AddHours(9)),  // Mehmet — sızmamalı
            Shift(branchId, positionId, null, range.AddHours(9))       // açık vardiya — sızmamalı
        );
        await db.SaveChangesAsync();

        var currentUser = new FakeCurrentUserProvider { CurrentUserId = ayseId };
        var handler = new MyShiftsHandler(db, currentUser);

        var result = await handler.Handle(
            new MyShiftsQuery(range, range.AddDays(7)), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, s => Assert.Equal(ayseId, s.UserId));
    }

    // ── /shifts/mine: tarih aralığı dışındaki vardiya gelmez ──
    [Fact]
    public async Task MyShifts_Aralik_Disini_Getirmez()
    {
        var (db, ayseId, _, branchId, positionId) = Setup();
        var range = new DateTime(2026, 7, 6, 0, 0, 0, DateTimeKind.Utc);
        db.Shifts.AddRange(
            Shift(branchId, positionId, ayseId, range.AddHours(9)),        // içinde
            Shift(branchId, positionId, ayseId, range.AddDays(30).AddHours(9)) // dışında
        );
        await db.SaveChangesAsync();

        var currentUser = new FakeCurrentUserProvider { CurrentUserId = ayseId };
        var handler = new MyShiftsHandler(db, currentUser);

        var result = await handler.Handle(
            new MyShiftsQuery(range, range.AddDays(7)), CancellationToken.None);

        Assert.Single(result);
    }

    // ── /shifts/mine: kimlik yoksa 401 (UnauthorizedAccessException) ──
    [Fact]
    public async Task MyShifts_Kimliksiz_401_Firlatir()
    {
        var (db, _, _, _, _) = Setup();
        var currentUser = new FakeCurrentUserProvider { CurrentUserId = null };
        var handler = new MyShiftsHandler(db, currentUser);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new MyShiftsQuery(DateTime.UtcNow, DateTime.UtcNow.AddDays(7)),
                CancellationToken.None));
    }

    // ── /tasks/mine: yalnızca çağırana atanmış görevler; başkasınınki/pozisyon sızmaz ──
    [Fact]
    public async Task MyTasks_Sadece_Kendine_Atanmislari_Dondurur()
    {
        var (db, ayseId, mehmetId, branchId, positionId) = Setup();
        db.Tasks.AddRange(
            new TaskItem { BranchId = branchId, Title = "Ayşe-1", AssignedUserId = ayseId },
            new TaskItem { BranchId = branchId, Title = "Ayşe-2", AssignedUserId = ayseId },
            new TaskItem { BranchId = branchId, Title = "Mehmet-1", AssignedUserId = mehmetId }, // sızmamalı
            new TaskItem { BranchId = branchId, Title = "Pozisyon", AssignedPositionId = positionId } // sızmamalı
        );
        await db.SaveChangesAsync();

        var currentUser = new FakeCurrentUserProvider { CurrentUserId = ayseId };
        var handler = new MyTasksHandler(db, currentUser);

        var result = await handler.Handle(new MyTasksQuery(null), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal(ayseId, t.AssignedUserId));
    }

    // ── /tasks/mine: status filtresi çağıranın görevlerini daraltır ──
    [Fact]
    public async Task MyTasks_Status_Filtresi_Daraltir()
    {
        var (db, ayseId, _, branchId, _) = Setup();
        db.Tasks.AddRange(
            new TaskItem { BranchId = branchId, Title = "ToDo", AssignedUserId = ayseId, Status = TaskItemStatus.ToDo },
            new TaskItem { BranchId = branchId, Title = "Done", AssignedUserId = ayseId, Status = TaskItemStatus.Done }
        );
        await db.SaveChangesAsync();

        var currentUser = new FakeCurrentUserProvider { CurrentUserId = ayseId };
        var handler = new MyTasksHandler(db, currentUser);

        var result = await handler.Handle(
            new MyTasksQuery((int)TaskItemStatus.Done), CancellationToken.None);

        Assert.Single(result);
        Assert.Equal((int)TaskItemStatus.Done, result[0].Status);
    }
}
