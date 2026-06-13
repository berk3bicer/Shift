using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.TimeOff.Decide;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// İzin onay/red state machine testleri.
public class DecideTimeOffTests
{
    private static async Task<(ShiftDbContext db, FakeCurrentUserProvider currentUser, Guid requestId, Guid managerId)>
        SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var staff = new User { TenantId = tenantId, FullName = "Personel", Email = "s@x.com", PasswordHash = "x" };
        var manager = new User { TenantId = tenantId, FullName = "Yonetici", Email = "m@x.com", PasswordHash = "x" };
        db.Users.AddRange(staff, manager);

        var request = new TimeOffRequest
        {
            UserId = staff.Id,
            StartDate = new DateOnly(2026, 8, 1),
            EndDate = new DateOnly(2026, 8, 3),
            Type = TimeOffType.Excuse,
            Status = TimeOffStatus.Pending
        };
        db.TimeOffRequests.Add(request);
        await db.SaveChangesAsync();

        var currentUser = new FakeCurrentUserProvider { CurrentUserId = manager.Id };
        return (db, currentUser, request.Id, manager.Id);
    }

    // ── Pending talep onaylanır → Approved + denetim alanları dolar ──
    [Fact]
    public async Task Pending_Talep_Onaylanir()
    {
        var (db, currentUser, requestId, managerId) = await SetupAsync();
        var handler = new DecideTimeOffHandler(db, currentUser);

        var result = await handler.Handle(
            new DecideTimeOffCommand(requestId, TimeOffDecision.Approve, "Uygun"),
            CancellationToken.None);

        Assert.Equal("Approved", result.Status);

        var saved = await db.TimeOffRequests.FirstAsync(t => t.Id == requestId);
        Assert.Equal(TimeOffStatus.Approved, saved.Status);
        Assert.Equal(managerId, saved.DecidedByUserId);   // kararı veren damgalandı
        Assert.Equal("Uygun", saved.DecisionNote);
    }

    // ── Zaten Approved talep tekrar karara alınamaz → hata (state machine) ──
    [Fact]
    public async Task Sonuclanmis_Talep_Tekrar_Karara_Alinamaz()
    {
        var (db, currentUser, requestId, _) = await SetupAsync();
        var handler = new DecideTimeOffHandler(db, currentUser);

        // Önce onayla (Pending → Approved)
        await handler.Handle(
            new DecideTimeOffCommand(requestId, TimeOffDecision.Approve, null),
            CancellationToken.None);

        // Şimdi reddetmeyi dene → terminal durumdan geçiş yasak
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(
                new DecideTimeOffCommand(requestId, TimeOffDecision.Reject, null),
                CancellationToken.None));
    }
}