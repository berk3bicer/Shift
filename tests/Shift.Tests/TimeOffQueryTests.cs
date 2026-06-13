using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.TimeOff.Mine;
using Shift.Application.Features.TimeOff.Pending;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Mine (kendi talepleri) ve Pending (onay kuyruğu) query'leri.
public class TimeOffQueryTests
{
    private static async Task<(ShiftDbContext db, Guid aliId, Guid veliId)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var ali = new User { TenantId = tenantId, FullName = "Ali", Email = "ali@x.com", PasswordHash = "x" };
        var veli = new User { TenantId = tenantId, FullName = "Veli", Email = "veli@x.com", PasswordHash = "x" };
        db.Users.AddRange(ali, veli);

        // Ali: 1 Pending + 1 Approved. Veli: 1 Pending.
        db.TimeOffRequests.AddRange(
            new TimeOffRequest { UserId = ali.Id, StartDate = new DateOnly(2026, 7, 1), EndDate = new DateOnly(2026, 7, 3), Type = TimeOffType.AnnualPaid, Status = TimeOffStatus.Pending },
            new TimeOffRequest { UserId = ali.Id, StartDate = new DateOnly(2026, 8, 1), EndDate = new DateOnly(2026, 8, 3), Type = TimeOffType.AnnualPaid, Status = TimeOffStatus.Approved },
            new TimeOffRequest { UserId = veli.Id, StartDate = new DateOnly(2026, 9, 1), EndDate = new DateOnly(2026, 9, 3), Type = TimeOffType.Sick, Status = TimeOffStatus.Pending }
        );
        await db.SaveChangesAsync();
        return (db, ali.Id, veli.Id);
    }

    // ── Mine: yalnızca login olan kullanıcının talepleri döner ──
    [Fact]
    public async Task Mine_Sadece_Kendi_Taleplerini_Dondurur()
    {
        var (db, aliId, veliId) = await SetupAsync();
        var currentUser = new FakeCurrentUserProvider { CurrentUserId = aliId };
        var handler = new MyTimeOffHandler(db, currentUser);

        var result = await handler.Handle(new MyTimeOffQuery(), CancellationToken.None);

        // Ali'nin 2 talebi var; Veli'ninki sızmamalı.
        Assert.Equal(2, result.Count);
        Assert.All(result, r => Assert.Equal(aliId, r.UserId));
    }

    // ── Pending: yalnızca bekleyen talepler döner (tüm personel) ──
    [Fact]
    public async Task Pending_Sadece_Bekleyenleri_Dondurur()
    {
        var (db, aliId, veliId) = await SetupAsync();
        var handler = new PendingTimeOffHandler(db);

        var result = await handler.Handle(new PendingTimeOffQuery(), CancellationToken.None);

        // Ali'nin Pending'i + Veli'nin Pending'i = 2. Ali'nin Approved'ı gelmemeli.
        Assert.Equal(2, result.Count);
        Assert.All(result, r => Assert.Equal(TimeOffStatus.Pending, r.Status));
    }
}