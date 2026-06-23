using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Services.Overtime;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Mesai hesap motoru: haftalık 45s fazla mesai + haftaya gruplama + dönem toplamı.
public class OvertimeCalculatorTests
{
    // Ortak kurulum: tenant + bir personel. Calculator yalnızca db'ye bağlı.
    private static async Task<(ShiftDbContext db, Guid tenantId, Guid staffId)> SetupAsync()
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
        db.Users.Add(staff);
        await db.SaveChangesAsync();

        return (db, tenantId, staff.Id);
    }

    // Yardımcı: kapalı bir TimeClock kaydı ekler (giriş + süre saat).
    // Tüm tarihler UTC. branchId testte önemsiz (hesap şubeye bakmıyor) → rastgele.
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

    // ── 1) 45 saatin ALTI: hepsi normal, fazla mesai yok ──
    [Fact]
    public async Task Haftalik_45_Altinda_Fazla_Mesai_Yok()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        // 2026-06-01 Pazartesi. 5 gün × 8 saat = 40 saat.
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 5; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, monday.AddDays(i), 8);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(40m, result.TotalHours);
        Assert.Equal(40m, result.NormalHours);
        Assert.Equal(0m, result.OvertimeHours);
        Assert.Single(result.Weeks);                       // tek hafta
        Assert.Equal(new DateOnly(2026, 6, 1), result.Weeks[0].WeekStart); // Pazartesi
    }

    // ── 2) 45 saatin ÜSTÜ: aşan kısım fazla mesai ──
    [Fact]
    public async Task Haftalik_45_Ustu_Fazla_Mesai_Olarak_Isaretlenir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        // 2026-06-01 Pazartesi. 6 gün × 9 saat = 54 saat → 45 normal + 9 fazla.
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 6; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, monday.AddDays(i), 9);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(54m, result.TotalHours);
        Assert.Equal(45m, result.NormalHours);
        Assert.Equal(9m, result.OvertimeHours);
    }

    // ── 3) İKİ ayrı hafta: fazla mesai her hafta AYRI hesaplanır ──
    // Bu, "aylık toplamdan 45 çıkar" hatasını yakalayan kritik test.
    [Fact]
    public async Task Iki_Hafta_Fazla_Mesai_Ayri_Hesaplanir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        // 1. hafta (2026-06-01 Pzt): 5 × 8 = 40 saat → 0 fazla
        var week1 = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 5; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, week1.AddDays(i), 8);

        // 2. hafta (2026-06-08 Pzt): 5 × 10 = 50 saat → 5 fazla
        var week2 = new DateTime(2026, 6, 8, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 5; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, week2.AddDays(i), 10);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        // Toplam 90 saat. Aylık toplamdan 45 çıkarsaydık 45 fazla mesai çıkardı (YANLIŞ).
        // Doğrusu: hafta1=0 + hafta2=5 = 5 fazla mesai.
        Assert.Equal(90m, result.TotalHours);
        Assert.Equal(85m, result.NormalHours);   // 40 + 45
        Assert.Equal(5m, result.OvertimeHours);  // 0 + 5
        Assert.Equal(2, result.Weeks.Count);
    }

    // ── 4) Açık kayıt (çıkış yok) hesaba GİRMEZ ──
    [Fact]
    public async Task Acik_Kayit_Hesaba_Girmez()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        await AddClosedRecordAsync(db, tenantId, staffId, monday, 8);  // kapalı: sayılır

        // Açık kayıt (CheckOutTime null): sayılmamalı.
        db.TimeClocks.Add(new TimeClock
        {
            TenantId = tenantId,
            UserId = staffId,
            BranchId = Guid.NewGuid(),
            CheckInTime = monday.AddDays(1),
            CheckOutTime = null,
            Method = ClockMethod.QR
        });
        await db.SaveChangesAsync();

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(8m, result.TotalHours);   // sadece kapalı kayıt
    }

    // ── 5) Dönem dışındaki kayıt hesaba GİRMEZ ──
    [Fact]
    public async Task Donem_Disindaki_Kayit_Girmez()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        // Mayıs'taki kayıt (dönem Haziran) → girmemeli.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 5, 20, 9, 0, 0, DateTimeKind.Utc), 8);
        // Haziran'daki kayıt → girmeli.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 10, 9, 0, 0, DateTimeKind.Utc), 6);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(6m, result.TotalHours);   // sadece Haziran
    }
}