using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.TimeClocks.ClockIn;
using Shift.Application.Features.TimeClocks.ClockOut;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

// Giriş-çıkış (Time Clock): açık kayıt state machine'i + geç giriş + bildirim.
public class TimeClockTests
{
    // Ortak kurulum: tenant, şube, pozisyon, bir personel.
    private static async Task<(ShiftDbContext db, FakeCurrentUserProvider currentUser,
        Guid tenantId, Guid branchId, Guid positionId, Guid staffId)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var branch = new Branch { TenantId = tenantId, Name = "Test Sube" };
        var position = new Position { TenantId = tenantId, Name = "Barista" };
        var staff = new User { TenantId = tenantId, FullName = "Personel", Email = "p@x.com", PasswordHash = "x" };
        db.Branches.Add(branch);
        db.Positions.Add(position);
        db.Users.Add(staff);
        await db.SaveChangesAsync();

        var currentUser = new FakeCurrentUserProvider { CurrentUserId = staff.Id };
        return (db, currentUser, tenantId, branch.Id, position.Id, staff.Id);
    }

    // ── 1) ClockIn açık kayıt oluşturur ──
    [Fact]
    public async Task ClockIn_Acik_Kayit_Olusturur()
    {
        var (db, currentUser, _, branchId, _, staffId) = await SetupAsync();
        var handler = new ClockInHandler(db, currentUser);

        var result = await handler.Handle(
            new ClockInCommand(branchId, ClockMethod.QR), CancellationToken.None);

        var record = await db.TimeClocks.FirstAsync(tc => tc.Id == result.TimeClockId);
        Assert.Equal(staffId, record.UserId);
        Assert.Null(record.CheckOutTime);          // açık
        Assert.False(result.IsLate);                // atanmış vardiya yok → geç değil
    }

    // ── 2) Açık kayıt varken ikinci ClockIn engellenir (state machine) ──
    [Fact]
    public async Task Acik_Kayit_Varken_Ikinci_ClockIn_Engellenir()
    {
        var (db, currentUser, _, branchId, _, _) = await SetupAsync();
        var handler = new ClockInHandler(db, currentUser);

        await handler.Handle(new ClockInCommand(branchId, ClockMethod.QR), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new ClockInCommand(branchId, ClockMethod.QR), CancellationToken.None));
    }

    // ── 3) ClockOut açık kaydı kapatır ──
    [Fact]
    public async Task ClockOut_Acik_Kaydi_Kapatir()
    {
        var (db, currentUser, _, branchId, _, _) = await SetupAsync();
        var clockIn = new ClockInHandler(db, currentUser);
        var clockOut = new ClockOutHandler(db, currentUser);

        var inResult = await clockIn.Handle(
            new ClockInCommand(branchId, ClockMethod.PIN), CancellationToken.None);
        var outResult = await clockOut.Handle(new ClockOutCommand(), CancellationToken.None);

        Assert.Equal(inResult.TimeClockId, outResult.TimeClockId);  // aynı kayıt
        var record = await db.TimeClocks.FirstAsync(tc => tc.Id == inResult.TimeClockId);
        Assert.NotNull(record.CheckOutTime);                         // kapandı
        Assert.True(outResult.WorkedMinutes >= 0);
    }

    // ── 4) Açık kayıt yokken ClockOut hata verir ──
    [Fact]
    public async Task Acik_Kayit_Yokken_ClockOut_Hata_Verir()
    {
        var (db, currentUser, _, _, _, _) = await SetupAsync();
        var clockOut = new ClockOutHandler(db, currentUser);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            clockOut.Handle(new ClockOutCommand(), CancellationToken.None));
    }

    // ── 5) Geç giriş → IsLate true + yöneticiye bildirim ──
    [Fact]
    public async Task Gec_Giris_IsLate_Ve_Yonetici_Bildirimi()
    {
        var (db, currentUser, tenantId, branchId, positionId, staffId) = await SetupAsync();

        // Bu şubeye atanmış bir Manager kuralım (bildirim hedefi).
        var manager = new User { TenantId = tenantId, FullName = "Mudur", Email = "m@x.com", PasswordHash = "x" };
        db.Users.Add(manager);
        // InMemory provider HasData seed'ini UYGULAMAZ → Manager rolünü elle ekle.
        // (Canlı DB'de bu rol migration ile seed'li; yalnızca testte gerekli.)
        var managerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        db.Roles.Add(new Role { Id = managerRoleId, Type = RoleType.Manager, Name = "Yönetici" });
        db.UserRoles.Add(new UserRole
        {
            TenantId = tenantId,
            UserId = manager.Id,
            RoleId = managerRoleId
        });
        db.UserBranches.Add(new UserBranch { TenantId = tenantId, UserId = manager.Id, BranchId = branchId });

        // Personele, başlangıcı 1 saat ÖNCE olan Published vardiya → giriş geç.
        var shiftStart = DateTime.UtcNow.AddHours(-1);
        db.Shifts.Add(new ShiftEntity
        {
            TenantId = tenantId,
            BranchId = branchId,
            PositionId = positionId,
            UserId = staffId,
            StartTime = shiftStart,
            EndTime = shiftStart.AddHours(8),
            Status = ShiftStatus.Published
        });
        await db.SaveChangesAsync();

        var handler = new ClockInHandler(db, currentUser);
        var result = await handler.Handle(
            new ClockInCommand(branchId, ClockMethod.QR), CancellationToken.None);

        Assert.True(result.IsLate);   // 1 saat geç (5 dk tolerans aşıldı)
        // Manager'a geç giriş bildirimi gitti
        Assert.Equal(1, await db.Notifications.CountAsync(
            n => n.UserId == manager.Id && n.Type == NotificationType.LateClockIn));
    }
}