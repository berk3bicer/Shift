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

    // ════════════════════════════════════════════════════════════════
    //  ÜCRET / BRÜT HESABI (Gün 13)
    // ════════════════════════════════════════════════════════════════

    // Yardımcı: bir personele ücretli pozisyon atar.
    private static async Task AssignPositionWithRateAsync(
        ShiftDbContext db, Guid tenantId, Guid staffId, decimal? hourlyRate)
    {
        var position = new Position
        {
            TenantId = tenantId,
            Name = "Barista",
            HourlyRate = hourlyRate
        };
        db.Positions.Add(position);
        await db.SaveChangesAsync();

        var staff = await db.Users.FirstAsync(u => u.Id == staffId);
        staff.PositionId = position.Id;
        await db.SaveChangesAsync();
    }

    // ── 6) Ücretli personel, fazla mesai YOK: brüt = saat × ücret ──
    [Fact]
    public async Task Ucretli_Personel_Normal_Saat_Brut_Hesaplanir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);

        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 5; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, monday.AddDays(i), 8);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(100m, result.AppliedHourlyRate);
        Assert.Equal(1.5m, result.OvertimeMultiplier);
        Assert.Equal(4000m, result.GrossAmount);   // 40 × 100
    }

    // ── 7) Ücretli personel, FAZLA MESAİLİ: çarpan uygulanır ──
    [Fact]
    public async Task Ucretli_Personel_Fazla_Mesai_Carpan_Uygulanir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);

        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 6; i++)
            await AddClosedRecordAsync(db, tenantId, staffId, monday.AddDays(i), 9);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        // 45 × 100 = 4500  +  9 × 100 × 1.5 = 1350  →  5850
        Assert.Equal(5850m, result.GrossAmount);
    }

    // ── 8) ÜCRETSİZ personel (pozisyon/ücret yok): brüt NULL ──
    [Fact]
    public async Task Ucretsiz_Personel_Brut_Null_Doner()
    {
        var (db, tenantId, staffId) = await SetupAsync();

        var monday = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        await AddClosedRecordAsync(db, tenantId, staffId, monday, 8);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Null(result.AppliedHourlyRate);
        Assert.Null(result.OvertimeMultiplier);
        Assert.Null(result.GrossAmount);
        Assert.Equal(8m, result.TotalHours);   // saat hesaplanır, ücret null
    }

    // ════════════════════════════════════════════════════════════════
    //  GECE / HAFTA SONU PRİMİ (Gün 14) — çarpan TÜM vardiyaya, differential
    // ════════════════════════════════════════════════════════════════

    // Yardımcı: tenant'a çarpan ayarı yazar (gece/hafta sonu). Verilmeyen 1.0 (etkisiz).
    private static async Task SetMultipliersAsync(
        ShiftDbContext db, Guid tenantId,
        decimal night = 1.0m, decimal weekend = 1.0m)
    {
        db.OvertimeSettings.Add(new OvertimeSettings
        {
            TenantId = tenantId,
            NightMultiplier = night,
            WeekendMultiplier = weekend
            // Eşik/fazla mesai/gece penceresi entity varsayılanları (45 / 1.5 / 20:00–06:00).
        });
        await db.SaveChangesAsync();
    }

    // ── 9) HAFTA SONU primi: Cmt vardiyasının TÜM saatine (çarpan−1) ──
    [Fact]
    public async Task Hafta_Sonu_Vardiyasi_Tum_Saate_Prim_Alir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);
        await SetMultipliersAsync(db, tenantId, weekend: 2.0m);

        // 2026-06-06 Cumartesi, 8 saat. Tek vardiya, hafta sonu.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 6, 9, 0, 0, DateTimeKind.Utc), 8);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        // Taban: 8 × 100 = 800. Hafta sonu primi: 8 × 100 × (2.0−1) = 800.
        Assert.Equal(800m, result.WeekendPremium);
        Assert.Equal(0m, result.NightPremium);          // gece değil → prim 0 (null değil, ücret var)
        Assert.Equal(1600m, result.GrossAmount);        // 800 taban + 800 prim
    }

    // ── 10) GECE primi: vardiya gece penceresine DEĞİYORSA tüm saati primli ──
    [Fact]
    public async Task Gece_Penceresine_Degen_Vardiya_Tum_Saate_Prim_Alir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);
        await SetMultipliersAsync(db, tenantId, night: 1.5m);

        // 2026-06-03 Çarşamba 18:00–22:00 (4s). Pencere 20:00–06:00'ya değiyor (20–22).
        // Karar: değen vardiyanın TÜM 4 saati gece → prim 4×100×0.5 = 200.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 3, 18, 0, 0, DateTimeKind.Utc), 4);
        // 2026-06-04 Perşembe 09:00–17:00 (8s). Geceye DEĞMİYOR → prim yok.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 4, 9, 0, 0, DateTimeKind.Utc), 8);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(200m, result.NightPremium);        // sadece gece vardiyası
        Assert.Equal(0m, result.WeekendPremium);        // ikisi de hafta içi
        // Taban: 12 × 100 = 1200 (45 altı, hepsi normal). Brüt 1200 + 200 = 1400.
        Assert.Equal(1400m, result.GrossAmount);
    }

    // ── 11) Gece yarısını SARAN vardiya: 22:00→06:00 tamamı gece ──
    [Fact]
    public async Task Gece_Yarisini_Asan_Vardiya_Gece_Sayilir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);
        await SetMultipliersAsync(db, tenantId, night: 2.0m);

        // 2026-06-02 Salı 22:00 → 2026-06-03 06:00 (8s). Pencere 20:00–06:00 içinde.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 2, 22, 0, 0, DateTimeKind.Utc), 8);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(800m, result.NightPremium);        // 8 × 100 × (2.0−1)
    }

    // ── 12) STACK: gece + hafta sonu aynı vardiyada toplanır ──
    [Fact]
    public async Task Gece_Ve_Hafta_Sonu_Primleri_Toplanir()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);
        await SetMultipliersAsync(db, tenantId, night: 1.5m, weekend: 2.0m);

        // 2026-06-06 Cumartesi 20:00–24:00 (4s). Hem hafta sonu hem gece.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 6, 20, 0, 0, DateTimeKind.Utc), 4);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(200m, result.NightPremium);        // 4×100×0.5
        Assert.Equal(400m, result.WeekendPremium);      // 4×100×1.0
        // Taban 400 + gece 200 + hafta sonu 400 = 1000.
        Assert.Equal(1000m, result.GrossAmount);
    }

    // ── 13) Çarpan 1.0 (varsayılan): gece/hafta sonu vardiyası prim ALMAZ ──
    // null değil 0: ücret var ama prim yok. Geriye uyumluluğu çivileyen test.
    [Fact]
    public async Task Carpan_Bir_Ise_Prim_Sifir_Null_Degil()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await AssignPositionWithRateAsync(db, tenantId, staffId, 100m);
        // Ayar yazmıyoruz → çarpanlar 1.0 (varsayılan). Cmt + gece vardiyası.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 6, 22, 0, 0, DateTimeKind.Utc), 4);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Equal(0m, result.NightPremium);          // çarpan 1.0 → prim 0
        Assert.Equal(0m, result.WeekendPremium);
        Assert.Equal(400m, result.GrossAmount);         // sadece taban 4×100
    }

    // ── 14) ÜCRETSİZ personel: gece/hafta sonu vardiyasında bile prim NULL ──
    [Fact]
    public async Task Ucretsiz_Personel_Primler_Null_Doner()
    {
        var (db, tenantId, staffId) = await SetupAsync();
        await SetMultipliersAsync(db, tenantId, night: 2.0m, weekend: 2.0m);
        // Pozisyon/ücret YOK. Cmt gece vardiyası.
        await AddClosedRecordAsync(db, tenantId, staffId,
            new DateTime(2026, 6, 6, 22, 0, 0, DateTimeKind.Utc), 4);

        var calc = new OvertimeCalculator(db);
        var result = await calc.CalculateForUserAsync(
            staffId, new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30),
            CancellationToken.None);

        Assert.Null(result.NightPremium);               // ücret tanımsız → hesaplanamadı
        Assert.Null(result.WeekendPremium);
        Assert.Null(result.GrossAmount);
        Assert.Equal(4m, result.TotalHours);            // saat yine hesaplanır
    }
}