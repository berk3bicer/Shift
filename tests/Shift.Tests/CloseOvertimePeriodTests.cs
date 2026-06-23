using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Services.Overtime;
using Shift.Application.Features.Overtime.Close;
using Shift.Application.Features.Overtime.Unlock;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Dönem kapanış akışı: hesapla → dondur → kilitle → yaz.
// OvertimeCalculatorTests'in kurulum desenini izler (tenant + user + kapalı TimeClock).
public class CloseOvertimePeriodTests
{
    // Ortak kurulum: tenant + bir personel + kapanışı yapacak Owner.
    // staffId = mesaisi kapatılan; ownerId = kapatan (LockedByUserId'ye gidecek).
    private static async Task<(ShiftDbContext db, Guid tenantId, Guid staffId, Guid ownerId)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var staff = new User
        {
            TenantId = tenantId,
            FullName = "Personel",
            Email = "p@x.com",
            PasswordHash = "x"
        };
        var owner = new User
        {
            TenantId = tenantId,
            FullName = "Patron",
            Email = "o@x.com",
            PasswordHash = "x"
        };
        db.Users.AddRange(staff, owner);
        await db.SaveChangesAsync();

        return (db, tenantId, staff.Id, owner.Id);
    }

    // Yardımcı: kapalı bir TimeClock kaydı ekler (giriş + süre saat).
    private static async Task AddClosedRecordAsync(
        ShiftDbContext db, Guid tenantId, Guid staffId,
        DateTime checkInUtc, double hours)
    {
        db.TimeClocks.Add(new TimeClock
        {
            TenantId = tenantId,
            UserId = staffId,
            BranchId = Guid.NewGuid(),
            CheckInTime = checkInUtc,
            CheckOutTime = checkInUtc.AddHours(hours),
            Method = ClockMethod.QR
        });
        await db.SaveChangesAsync();
    }

    // Handler'ı kurar (Calculator + kapatan kimliği token'dan).
    private static CloseOvertimePeriodHandler MakeHandler(ShiftDbContext db, Guid ownerId)
    {
        var calculator = new OvertimeCalculator(db);
        var currentUser = new FakeCurrentUserProvider { CurrentUserId = ownerId };
        return new CloseOvertimePeriodHandler(db, calculator, currentUser);
    }

    // ── 1) Kapanış kayıt üretir, saatler doğru, kilit damgalı ──
    [Fact]
    public async Task Kapanis_Kayit_Uretir_Ve_Kilitler()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        // 2026-06-01 Pazartesi, 6 × 9 = 54 saat → 45 normal + 9 fazla.
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 6; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, monday.AddDays(i), 9);

        var handler = MakeHandler(db, ownerId);
        var recordId = await handler.Handle(
            new CloseOvertimePeriodCommand(staffId,
                new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30)),
            CancellationToken.None);

        var record = await db.OvertimeRecords.FirstAsync(o => o.Id == recordId);
        Assert.Equal(54m, record.TotalHours);
        Assert.Equal(45m, record.NormalHours);
        Assert.Equal(9m, record.OvertimeHours);
        Assert.True(record.IsLocked);
        Assert.NotNull(record.LockedAt);
        Assert.Equal(ownerId, record.LockedByUserId);   // kapatan token'dan
    }

    // ── 2) Haftalık kırılım snapshot'a doğru kopyalanır ──
    [Fact]
    public async Task Haftalik_Kirilim_Snapshot_Dolar()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        // 1. hafta: 5 × 8 = 40 (0 fazla). 2. hafta: 5 × 10 = 50 (5 fazla).
        var week1 = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 5; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, week1.AddDays(i), 8);
        var week2 = new DateTime(2026, 6, 8, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 5; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, week2.AddDays(i), 10);

        var handler = MakeHandler(db, ownerId);
        var recordId = await handler.Handle(
            new CloseOvertimePeriodCommand(staffId,
                new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30)),
            CancellationToken.None);

        var record = await db.OvertimeRecords.FirstAsync(o => o.Id == recordId);
        Assert.Equal(2, record.Weeks.Count);
        // İlk hafta Pazartesi 06-01, 0 fazla; ikinci hafta 06-08, 5 fazla.
        var w2 = record.Weeks.Single(w => w.WeekStart == new DateOnly(2026, 6, 8));
        Assert.Equal(50m, w2.TotalHours);
        Assert.Equal(5m, w2.OvertimeHours);
    }

    // ── 3) Aynı dönem iki kez kapatılamaz ──
    [Fact]
    public async Task Cift_Kapanis_Engellenir()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        await AddClosedRecordAsync(db, tenantId, staffId, monday, 8);

        var handler = MakeHandler(db, ownerId);
        var cmd = new CloseOvertimePeriodCommand(staffId,
            new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30));

        await handler.Handle(cmd, CancellationToken.None);   // ilk kapanış: OK

        // İkinci kez aynı dönem → hata.
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(cmd, CancellationToken.None));
    }

    // ── 4) Hiç kayıt yokken 0 saatlik dönem kapatılabilir ──
    // (örn. tüm ay izinli personel — geçerli bordro durumu).
    [Fact]
    public async Task Sifir_Saat_Donem_Kapatilabilir()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        // Hiç TimeClock yok.

        var handler = MakeHandler(db, ownerId);
        var recordId = await handler.Handle(
            new CloseOvertimePeriodCommand(staffId,
                new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30)),
            CancellationToken.None);

        var record = await db.OvertimeRecords.FirstAsync(o => o.Id == recordId);
        Assert.Equal(0m, record.TotalHours);
        Assert.True(record.IsLocked);
        Assert.Empty(record.Weeks);
    }

    // Unlock handler'ını kurar (kilidi açan kimliği token'dan).
    private static UnlockOvertimeRecordHandler MakeUnlockHandler(ShiftDbContext db, Guid ownerId)
    {
        var currentUser = new FakeCurrentUserProvider { CurrentUserId = ownerId };
        return new UnlockOvertimeRecordHandler(db, currentUser);
    }

    // ── 5) Unlock kilidi açar ve audit damgalar ──
    [Fact]
    public async Task Unlock_Kilidi_Acar_Ve_Audit_Damgalar()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        await AddClosedRecordAsync(db, tenantId, staffId, monday, 8);

        var close = MakeHandler(db, ownerId);
        var recordId = await close.Handle(
            new CloseOvertimePeriodCommand(staffId,
                new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30)),
            CancellationToken.None);

        var unlock = MakeUnlockHandler(db, ownerId);
        await unlock.Handle(new UnlockOvertimeRecordCommand(recordId), CancellationToken.None);

        var record = await db.OvertimeRecords.FirstAsync(o => o.Id == recordId);
        Assert.False(record.IsLocked);
        Assert.NotNull(record.UnlockedAt);
        Assert.Equal(ownerId, record.UnlockedByUserId);
    }

    // ── 6) Kilitliyken tekrar kapatma engellenir (önce unlock gerekir) ──
    [Fact]
    public async Task Kilitliyken_Tekrar_Kapatma_Engellenir()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        await AddClosedRecordAsync(db, tenantId, staffId, monday, 8);

        var close = MakeHandler(db, ownerId);
        var cmd = new CloseOvertimePeriodCommand(staffId,
            new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30));

        await close.Handle(cmd, CancellationToken.None);   // kapat (kilitli)

        // Kilitliyken tekrar → hata.
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => close.Handle(cmd, CancellationToken.None));
    }

    // ── 7) Unlock → veri değiştir → tekrar Close = recalculate (aynı kayıt, yeni değer) ──
    // Tüm düzeltme döngüsünün kanıtı: Id korunur, saatler tazelenir, unlock izi durur.
    [Fact]
    public async Task Unlock_Sonrasi_Tekrar_Close_Recalculate_Eder()
    {
        var (db, tenantId, staffId, ownerId) = await SetupAsync();
        // İlk kapanış: 1 kayıt × 8 saat.
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        await AddClosedRecordAsync(db, tenantId, staffId, monday, 8);

        var close = MakeHandler(db, ownerId);
        var cmd = new CloseOvertimePeriodCommand(staffId,
            new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30));
        var firstId = await close.Handle(cmd, CancellationToken.None);

        // Kilidi aç.
        var unlock = MakeUnlockHandler(db, ownerId);
        await unlock.Handle(new UnlockOvertimeRecordCommand(firstId), CancellationToken.None);

        // Eksik kalan bir gün eklendi (düzeltme): +5 saat ( Salı).
        await AddClosedRecordAsync(db, tenantId, staffId, monday.AddDays(1), 5);

        // Tekrar kapat → recalculate.
        var secondId = await close.Handle(cmd, CancellationToken.None);

        // Aynı kayıt (Id değişmedi) — üzerine yazıldı, yeni satır açılmadı.
        Assert.Equal(firstId, secondId);
        Assert.Single(db.OvertimeRecords);   // tek kayıt var

        var record = await db.OvertimeRecords.FirstAsync(o => o.Id == firstId);
        Assert.Equal(13m, record.TotalHours);   // 8 + 5
        Assert.True(record.IsLocked);           // tekrar kilitli
        Assert.NotNull(record.UnlockedAt);      // unlock izi DURUYOR (denetim)
    }
}