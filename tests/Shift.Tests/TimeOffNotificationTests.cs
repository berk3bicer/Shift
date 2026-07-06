using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.TimeOff.Create;
using Shift.Application.Features.TimeOff.Decide;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// İzin (TimeOff) akışı bildirimleri (spec §5.2 MVP):
//   Create → talep edenin şube Manager'ları + tüm Owner'lar (kendisi hariç)
//   Decide → talep eden personel (onay/red tipine göre)
// Hedef-kitle mantığı ClockInHandler.NotifyManagersAsync ile aynı; atomik-bildirim deseni
// CreateAnnouncement/CreateTask ile aynı.
public class TimeOffNotificationTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private ShiftDbContext _db = null!;
    private Guid _branchA, _branchB;
    private Guid _staffRoleId, _managerRoleId, _ownerRoleId;

    private async Task SetupAsync()
    {
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = _tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new ShiftDbContext(options, tenantProvider);

        var branchA = new Branch { TenantId = _tenantId, Name = "Sube A" };
        var branchB = new Branch { TenantId = _tenantId, Name = "Sube B" };
        var staffRole = new Role { Type = RoleType.Staff, Name = "Staff" };
        var managerRole = new Role { Type = RoleType.Manager, Name = "Manager" };
        var ownerRole = new Role { Type = RoleType.Owner, Name = "Owner" };
        _db.Branches.AddRange(branchA, branchB);
        _db.Roles.AddRange(staffRole, managerRole, ownerRole);
        await _db.SaveChangesAsync();

        _branchA = branchA.Id; _branchB = branchB.Id;
        _staffRoleId = staffRole.Id; _managerRoleId = managerRole.Id; _ownerRoleId = ownerRole.Id;
    }

    private async Task<Guid> AddUserAsync(Guid roleId, Guid? branchId)
    {
        var user = new User { TenantId = _tenantId, FullName = "U", Email = $"{Guid.NewGuid():N}@x.com", PasswordHash = "x" };
        _db.Users.Add(user);
        _db.UserRoles.Add(new UserRole { TenantId = _tenantId, UserId = user.Id, RoleId = roleId });
        if (branchId is { } b)
            _db.UserBranches.Add(new UserBranch { TenantId = _tenantId, UserId = user.Id, BranchId = b });
        await _db.SaveChangesAsync();
        return user.Id;
    }

    private async Task<Guid> AddPendingRequestAsync(Guid staffId)
    {
        var req = new TimeOffRequest
        {
            TenantId = _tenantId,
            UserId = staffId,
            StartDate = new DateOnly(2026, 8, 1),
            EndDate = new DateOnly(2026, 8, 3),
            Type = TimeOffType.Excuse,
            Status = TimeOffStatus.Pending
        };
        _db.TimeOffRequests.Add(req);
        await _db.SaveChangesAsync();
        return req.Id;
    }

    // ── CREATE 1) Talep → şube Manager'ı + Owner bildirilir; talep eden hariç ──
    [Fact]
    public async Task Create_Sube_Manageri_Ve_Owner_Bildirilir_Talep_Eden_Haric()
    {
        await SetupAsync();
        var staff = await AddUserAsync(_staffRoleId, _branchA);
        var managerA = await AddUserAsync(_managerRoleId, _branchA);   // hedef
        var owner = await AddUserAsync(_ownerRoleId, null);            // hedef (şube bağımsız)
        await AddUserAsync(_managerRoleId, _branchB);                  // BAŞKA şube — hedef değil

        var handler = new CreateTimeOffHandler(_db, new FakeCurrentUserProvider { CurrentUserId = staff });
        var result = await handler.Handle(
            new CreateTimeOffCommand(new DateOnly(2026, 8, 1), new DateOnly(2026, 8, 3), TimeOffType.Excuse, "gerekçe"),
            CancellationToken.None);

        var notifs = await _db.Notifications
            .Where(n => n.Type == NotificationType.TimeOffRequested).ToListAsync();
        Assert.Equal(2, notifs.Count);                                            // managerA + owner
        Assert.Equal(1, notifs.Count(n => n.UserId == managerA));
        Assert.Equal(1, notifs.Count(n => n.UserId == owner));
        Assert.Equal(0, notifs.Count(n => n.UserId == staff));                    // talep edene YOK
        Assert.All(notifs, n => Assert.Equal(result.TimeOffRequestId, n.RelatedEntityId));
    }

    // ── CREATE 2) Talep eden aynı zamanda Owner ise kendine bildirim gitmez ──
    [Fact]
    public async Task Create_Talep_Eden_Owner_Ise_Kendine_Gitmez()
    {
        await SetupAsync();
        var ownerRequester = await AddUserAsync(_ownerRoleId, _branchA);

        var handler = new CreateTimeOffHandler(_db, new FakeCurrentUserProvider { CurrentUserId = ownerRequester });
        await handler.Handle(
            new CreateTimeOffCommand(new DateOnly(2026, 8, 1), new DateOnly(2026, 8, 3), TimeOffType.Excuse, null),
            CancellationToken.None);

        Assert.Equal(0, await _db.Notifications.CountAsync(n => n.UserId == ownerRequester));
    }

    // ── DECIDE 1) Onay → talep eden personele TimeOffApproved ──
    [Fact]
    public async Task Decide_Onay_Personele_Approved_Bildirimi()
    {
        await SetupAsync();
        var staff = await AddUserAsync(_staffRoleId, _branchA);
        var manager = await AddUserAsync(_managerRoleId, _branchA);
        var reqId = await AddPendingRequestAsync(staff);

        var handler = new DecideTimeOffHandler(_db, new FakeCurrentUserProvider { CurrentUserId = manager });
        await handler.Handle(new DecideTimeOffCommand(reqId, TimeOffDecision.Approve, "Uygun"), CancellationToken.None);

        var notif = await _db.Notifications.SingleAsync(n => n.UserId == staff);
        Assert.Equal(NotificationType.TimeOffApproved, notif.Type);
        Assert.Equal(reqId, notif.RelatedEntityId);
        Assert.Contains("onaylandı", notif.Message);
        Assert.Contains("Uygun", notif.Message);                                  // karar notu mesaja eklendi
    }

    // ── DECIDE 2) Red → talep eden personele TimeOffRejected ──
    [Fact]
    public async Task Decide_Red_Personele_Rejected_Bildirimi()
    {
        await SetupAsync();
        var staff = await AddUserAsync(_staffRoleId, _branchA);
        var manager = await AddUserAsync(_managerRoleId, _branchA);
        var reqId = await AddPendingRequestAsync(staff);

        var handler = new DecideTimeOffHandler(_db, new FakeCurrentUserProvider { CurrentUserId = manager });
        await handler.Handle(new DecideTimeOffCommand(reqId, TimeOffDecision.Reject, null), CancellationToken.None);

        var notif = await _db.Notifications.SingleAsync(n => n.UserId == staff);
        Assert.Equal(NotificationType.TimeOffRejected, notif.Type);
        Assert.Equal(reqId, notif.RelatedEntityId);
        Assert.Contains("reddedildi", notif.Message);
    }
}
