using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Exceptions;
using Shift.Application.Common.Services;
using Shift.Application.Features.ShiftPool.Decide;
using Shift.Application.Features.ShiftPool.Give;
using Shift.Application.Features.ShiftPool.Take;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

// Vardiya Havuzu (Shift Pool): Give / Take / Approve / Reject.
// Onay modu (Open/ApprovalRequired/Closed) davranışı + İş Kanunu çakışma bloğu +
// rol/sahiplik yetki kontrolleri + ŞART 1 (onay anında re-check).
public class ShiftPoolTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private ShiftDbContext _db = null!;
    private Guid _branchA;
    private Guid _baristaPositionId, _kasiyerPositionId;
    private Guid _ownerId, _managerId, _giver, _peer, _wrongPosUser;

    private async Task SetupAsync()
    {
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = _tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new ShiftDbContext(options, tenantProvider);

        var branchA = new Branch { TenantId = _tenantId, Name = "Kadıköy" };
        var barista = new Position { TenantId = _tenantId, Name = "Barista" };
        var kasiyer = new Position { TenantId = _tenantId, Name = "Kasiyer" };
        var ownerRole = new Role { Type = RoleType.Owner, Name = "Owner" };
        var managerRole = new Role { Type = RoleType.Manager, Name = "Manager" };
        var staffRole = new Role { Type = RoleType.Staff, Name = "Staff" };
        _db.Branches.Add(branchA);
        _db.Positions.AddRange(barista, kasiyer);
        _db.Roles.AddRange(ownerRole, managerRole, staffRole);
        await _db.SaveChangesAsync();

        _branchA = branchA.Id;
        _baristaPositionId = barista.Id;
        _kasiyerPositionId = kasiyer.Id;

        _ownerId = await AddUserAsync(ownerRole.Id, branchId: null, positionId: null);
        _managerId = await AddUserAsync(managerRole.Id, _branchA, positionId: null);
        _giver = await AddUserAsync(staffRole.Id, _branchA, _baristaPositionId);
        _peer = await AddUserAsync(staffRole.Id, _branchA, _baristaPositionId);
        _wrongPosUser = await AddUserAsync(staffRole.Id, _branchA, _kasiyerPositionId);
    }

    private async Task<Guid> AddUserAsync(Guid roleId, Guid? branchId, Guid? positionId)
    {
        var user = new User
        {
            TenantId = _tenantId,
            FullName = "U-" + Guid.NewGuid().ToString("N")[..6],
            Email = $"{Guid.NewGuid():N}@x.com",
            PasswordHash = "x",
            PositionId = positionId
        };
        _db.Users.Add(user);
        _db.UserRoles.Add(new UserRole { TenantId = _tenantId, UserId = user.Id, RoleId = roleId });
        if (branchId is { } b)
            _db.UserBranches.Add(new UserBranch { TenantId = _tenantId, UserId = user.Id, BranchId = b });
        await _db.SaveChangesAsync();
        return user.Id;
    }

    private static DateTime D(int day, int hour) =>
        new DateTime(2026, 10, day, hour, 0, 0, DateTimeKind.Utc);

    private async Task<Guid> AddShiftAsync(
        Guid? userId, Guid positionId, ShiftStatus status, DateTime start, DateTime end)
    {
        var shift = new ShiftEntity
        {
            BranchId = _branchA,
            PositionId = positionId,
            UserId = userId,
            StartTime = start,
            EndTime = end,
            Status = status
        };
        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync();
        return shift.Id;
    }

    private async Task SetModeAsync(PoolApprovalMode mode)
    {
        _db.ShiftPoolSettings.Add(new ShiftPoolSettings { ApprovalMode = mode });
        await _db.SaveChangesAsync();
    }

    private GiveShiftHandler GiveHandler(Guid callerId)
        => new(_db, new FakeCurrentUserProvider { CurrentUserId = callerId });

    private TakeShiftHandler TakeHandler(Guid callerId)
        => new(_db, new FakeCurrentUserProvider { CurrentUserId = callerId }, new ShiftRuleChecker(_db));

    private DecideShiftSwapHandler DecideHandler(Guid callerId)
        => new(_db, new FakeCurrentUserProvider { CurrentUserId = callerId }, new ShiftRuleChecker(_db));

    // ─────────────────────────── GIVE ───────────────────────────

    // ── Açık modda sun: Shift → UpForGrabs, swap Approved, uygun personele bildirim ──
    [Fact]
    public async Task Give_Acik_Mod_UpForGrabs_Ve_Uygun_Personele_Bildirim()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Open);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.Published, D(5, 9), D(5, 13));

        var result = await GiveHandler(_giver).Handle(new GiveShiftCommand(shiftId), CancellationToken.None);

        Assert.Equal((int)SwapStatus.Approved, result.Status);
        Assert.Equal((int)ShiftStatus.UpForGrabs, result.ShiftStatus);

        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(ShiftStatus.UpForGrabs, savedShift.Status);
        Assert.Equal(_giver, savedShift.UserId);   // sahibi hâlâ giver, biri kapana kadar

        // Uygun peer (aynı pozisyon+şube) bildirim aldı; giver'a gitmedi.
        Assert.Equal(1, await _db.Notifications.CountAsync(
            n => n.UserId == _peer && n.Type == NotificationType.ShiftUpForGrabs));
        Assert.Equal(0, await _db.Notifications.CountAsync(n => n.UserId == _giver));
        // Farklı pozisyondaki kullanıcı görünürlük dışı → bildirim yok.
        Assert.Equal(0, await _db.Notifications.CountAsync(n => n.UserId == _wrongPosUser));
    }

    // ── Başkasının vardiyasını sunamaz → 403 (ForbiddenAccessException) ──
    [Fact]
    public async Task Give_Baskasinin_Vardiyasi_403()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Open);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.Published, D(5, 9), D(5, 13));

        // _peer, _giver'ın vardiyasını sunmaya çalışıyor.
        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            GiveHandler(_peer).Handle(new GiveShiftCommand(shiftId), CancellationToken.None));

        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(ShiftStatus.Published, savedShift.Status);   // değişmedi
    }

    // ── Kapalı modda sunamaz → 403 ──
    [Fact]
    public async Task Give_Kapali_Mod_403()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Closed);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.Published, D(5, 9), D(5, 13));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            GiveHandler(_giver).Handle(new GiveShiftCommand(shiftId), CancellationToken.None));

        Assert.Equal(0, await _db.ShiftSwaps.CountAsync());
    }

    // ── SABİT ÜRÜN KARARI (b): ApprovalRequired'da sun → swap Pending, Shift DEĞİŞMEZ (Published kalır) ──
    [Fact]
    public async Task Give_ApprovalRequired_Pending_Shift_Published_Kalir()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.ApprovalRequired);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.Published, D(5, 9), D(5, 13));

        var result = await GiveHandler(_giver).Handle(new GiveShiftCommand(shiftId), CancellationToken.None);

        Assert.Equal((int)SwapStatus.Pending, result.Status);
        Assert.Equal((int)ShiftStatus.Published, result.ShiftStatus);   // havuza düşmedi

        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(ShiftStatus.Published, savedShift.Status);         // yönetici kontrolü öncelikli

        // Yöneticiye onay bildirimi (giver hariç). Owner + Manager.
        Assert.True(await _db.Notifications.CountAsync(
            n => n.Type == NotificationType.ShiftPoolActionRequested) >= 1);
        Assert.Equal(0, await _db.Notifications.CountAsync(
            n => n.UserId == _giver && n.Type == NotificationType.ShiftPoolActionRequested));
    }

    // ─────────────────────────── TAKE ───────────────────────────

    // ── Açık modda kap (UpForGrabs vardiya): UserId taker'a geçer, Filled ──
    [Fact]
    public async Task Take_Acik_Mod_UserId_Degisir_Filled()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Open);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(6, 9), D(6, 13));

        var result = await TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None);

        Assert.Equal((int)SwapStatus.Approved, result.Status);
        Assert.Equal((int)ShiftStatus.Filled, result.ShiftStatus);

        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(_peer, savedShift.UserId);          // sahiplik değişti
        Assert.Equal(ShiftStatus.Filled, savedShift.Status);

        // Yöneticiye bilgi bildirimi.
        Assert.True(await _db.Notifications.CountAsync(
            n => n.Type == NotificationType.ShiftTaken) >= 1);
    }

    // ── Açık vardiya (UserId=null, Published, hiç sunulmamış) da kapılabilir ──
    [Fact]
    public async Task Take_Acik_Vardiya_Open_Shift_Kapilir()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Open);
        var shiftId = await AddShiftAsync(null, _baristaPositionId, ShiftStatus.Published, D(6, 9), D(6, 13));

        var result = await TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None);

        Assert.Equal((int)ShiftStatus.Filled, result.ShiftStatus);
        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(_peer, savedShift.UserId);
    }

    // ── Çakışan vardiyayı kapayamaz → İş Kanunu hard-block (InvalidOperationException → 400) ──
    [Fact]
    public async Task Take_Cakisan_Vardiya_400()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Open);
        // _peer'in zaten 09–13 arası kendi vardiyası var.
        await AddShiftAsync(_peer, _baristaPositionId, ShiftStatus.Published, D(7, 9), D(7, 13));
        // Havuzdaki vardiya 11–15 → çakışır.
        var poolShiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(7, 11), D(7, 15));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            TakeHandler(_peer).Handle(new TakeShiftCommand(poolShiftId), CancellationToken.None));

        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == poolShiftId);
        Assert.Equal(ShiftStatus.UpForGrabs, savedShift.Status);   // değişmedi
        Assert.Equal(0, await _db.ShiftSwaps.CountAsync());
    }

    // ── Yanlış pozisyondaki vardiyayı kapayamaz → 403 (rol bazlı görünürlük) ──
    [Fact]
    public async Task Take_Yanlis_Pozisyon_403()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Open);
        // Barista pozisyonlu vardiya; ama kasiyer pozisyonlu kullanıcı kapmaya çalışıyor.
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(8, 9), D(8, 13));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            TakeHandler(_wrongPosUser).Handle(new TakeShiftCommand(shiftId), CancellationToken.None));
    }

    // ── Kapalı modda kapayamaz → 403 ──
    [Fact]
    public async Task Take_Kapali_Mod_403()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.Closed);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(8, 9), D(8, 13));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None));
    }

    // ── ApprovalRequired'da kap → swap Pending, Shift DEĞİŞMEZ ──
    [Fact]
    public async Task Take_ApprovalRequired_Pending_Shift_Degismez()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.ApprovalRequired);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(9, 9), D(9, 13));

        var result = await TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None);

        Assert.Equal((int)SwapStatus.Pending, result.Status);
        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(ShiftStatus.UpForGrabs, savedShift.Status);   // değişmedi
        Assert.Equal(_giver, savedShift.UserId);                   // sahiplik değişmedi
    }

    // ─────────────────────────── DECIDE ───────────────────────────

    // ── Onay: bekleyen Take onaylanır → mutasyon ONAY ANINDA gerçekleşir ──
    [Fact]
    public async Task Approve_Take_Mutasyon_Gerceklesir()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.ApprovalRequired);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(10, 9), D(10, 13));
        var take = await TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None);

        // Onay öncesi shift hâlâ değişmemiş olmalı.
        Assert.Equal(_giver, (await _db.Shifts.FirstAsync(s => s.Id == shiftId)).UserId);

        var result = await DecideHandler(_managerId).Handle(
            new DecideShiftSwapCommand(take.Id, SwapDecision.Approve), CancellationToken.None);

        Assert.Equal("Approved", result.Status);
        Assert.Equal((int)ShiftStatus.Filled, result.ShiftStatus);

        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(_peer, savedShift.UserId);   // mutasyon onay anında
        Assert.Equal(ShiftStatus.Filled, savedShift.Status);

        // Talep edene onay bildirimi.
        Assert.Equal(1, await _db.Notifications.CountAsync(
            n => n.UserId == _peer && n.Type == NotificationType.ShiftPoolApproved));
    }

    // ── ŞART 1 (KRİTİK): Onay anında ShiftRuleChecker TEKRAR koşar ──
    // ApprovalRequired'da _peer bir vardiya kapmak istedi (o an temizdi, Pending).
    // BEKLERKEN _peer'e çakışan başka vardiya atandı. Yönetici onaylamaya kalkınca
    // re-check çakışmayı yakalar → onay REDDEDİLİR (ilk yeşil kontrol geçersiz).
    [Fact]
    public async Task Approve_Take_State_Drift_Onay_Aninda_Cakisma_Ile_Reddedilir()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.ApprovalRequired);
        var poolShiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(11, 11), D(11, 15));

        // Take anında _peer'in çakışan vardiyası YOK → temiz geçer, Pending olur.
        var take = await TakeHandler(_peer).Handle(new TakeShiftCommand(poolShiftId), CancellationToken.None);
        Assert.Equal((int)SwapStatus.Pending, take.Status);

        // Onay BEKLERKEN _peer'e çakışan bir vardiya atandı (11:00–15:00 ile kesişen 09–13).
        await AddShiftAsync(_peer, _baristaPositionId, ShiftStatus.Published, D(11, 9), D(11, 13));

        // Onay → re-check çakışmayı yakalar → hata.
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DecideHandler(_managerId).Handle(
                new DecideShiftSwapCommand(take.Id, SwapDecision.Approve), CancellationToken.None));

        // Onay uygulanmadı: swap hâlâ Pending, havuz vardiyası hâlâ UpForGrabs (giver'da).
        var savedSwap = await _db.ShiftSwaps.FirstAsync(s => s.Id == take.Id);
        Assert.Equal(SwapStatus.Pending, savedSwap.Status);
        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == poolShiftId);
        Assert.Equal(ShiftStatus.UpForGrabs, savedShift.Status);
        Assert.Equal(_giver, savedShift.UserId);
    }

    // ── Red: talep reddedilir, Shift değişmez, talep edene bildirim ──
    [Fact]
    public async Task Reject_Talep_Shift_Degismez_Bildirim_Gider()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.ApprovalRequired);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(12, 9), D(12, 13));
        var take = await TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None);

        var result = await DecideHandler(_managerId).Handle(
            new DecideShiftSwapCommand(take.Id, SwapDecision.Reject), CancellationToken.None);

        Assert.Equal("Rejected", result.Status);
        var savedShift = await _db.Shifts.FirstAsync(s => s.Id == shiftId);
        Assert.Equal(ShiftStatus.UpForGrabs, savedShift.Status);   // değişmedi
        Assert.Equal(_giver, savedShift.UserId);
        Assert.Equal(1, await _db.Notifications.CountAsync(
            n => n.UserId == _peer && n.Type == NotificationType.ShiftPoolRejected));
    }

    // ── Sonuçlanmış talep tekrar karara alınamaz (state machine) ──
    [Fact]
    public async Task Sonuclanmis_Talep_Tekrar_Karara_Alinamaz()
    {
        await SetupAsync();
        await SetModeAsync(PoolApprovalMode.ApprovalRequired);
        var shiftId = await AddShiftAsync(_giver, _baristaPositionId, ShiftStatus.UpForGrabs, D(13, 9), D(13, 13));
        var take = await TakeHandler(_peer).Handle(new TakeShiftCommand(shiftId), CancellationToken.None);

        await DecideHandler(_managerId).Handle(
            new DecideShiftSwapCommand(take.Id, SwapDecision.Reject), CancellationToken.None);

        // Zaten Rejected → tekrar onaylanamaz.
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DecideHandler(_managerId).Handle(
                new DecideShiftSwapCommand(take.Id, SwapDecision.Approve), CancellationToken.None));
    }
}
