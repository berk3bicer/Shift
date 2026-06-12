using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Shifts.Create;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;
using ShiftEntity = Shift.Domain.Entities.Shift;

namespace Shift.Tests;

// Gün 4: Vardiya iş kuralları (çakışma + İş Kanunu limitleri).
// Handler'ı gerçek ShiftDbContext (InMemory) ile çağırırız; global query filter
// EF seviyesinde çalıştığı için InMemory'de de devrede → tenant izolasyonu da geçerli.
public class CreateShiftRulesTests
{
    // Test ortamı: tek tenant, bir şube + bir pozisyon + bir personel hazır.
    // Dönen değerler testte vardiya oluştururken kullanılır.
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

    // Belirli saatlerde, atanmış bir vardiyayı doğrudan DB'ye yazan kısayol (seed için).
    private static async Task SeedShiftAsync(
        ShiftDbContext db, Guid branchId, Guid positionId, Guid userId,
        DateTime start, DateTime end)
    {
        db.Shifts.Add(new ShiftEntity
        {
            BranchId = branchId,
            PositionId = positionId,
            UserId = userId,
            StartTime = start,
            EndTime = end,
            Status = ShiftStatus.Draft
        });
        await db.SaveChangesAsync();
    }

    private static DateTime D(int day, int hour) =>
        new DateTime(2026, 6, day, hour, 0, 0, DateTimeKind.Utc);

    // ── Çakışma = HATA ──
    [Fact]
    public async Task Cakisan_Vardiya_Hata_Firlatir()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // Mevcut: 15 Haz 09:00–13:00
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 9), D(15, 13));

        var handler = new CreateShiftHandler(db);
        // Yeni: 15 Haz 11:00–15:00 → ortaya biniyor → çakışma
        var cmd = new CreateShiftCommand(branchId, positionId, userId, D(15, 11), D(15, 15), null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(cmd, CancellationToken.None));
    }

    // ── Sırt sırta vardiya çakışma DEĞİL ──
    [Fact]
    public async Task Sirt_Sirta_Vardiya_Cakisma_Sayilmaz()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 9), D(15, 13));

        var handler = new CreateShiftHandler(db);
        // 13:00–17:00 → ilkinin tam bittiği anda başlıyor → meşru
        var cmd = new CreateShiftCommand(branchId, positionId, userId, D(15, 13), D(15, 17), null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.ShiftId);
        Assert.Empty(result.Warnings); // 8 saat → hiçbir limit aşılmaz
    }

    // ── Günlük 11 saat = UYARI (kayıt yine oluşur) ──
    [Fact]
    public async Task Gunluk_11_Saat_Asiminda_Uyari_Doner_Ama_Kayit_Olusur()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // Aynı gün 8 saat: 09–13 + 13–17
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 9), D(15, 13));
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 13), D(15, 17));

        var handler = new CreateShiftHandler(db);
        // +4 saat: 17–21 → toplam 12 saat (>11)
        var cmd = new CreateShiftCommand(branchId, positionId, userId, D(15, 17), D(15, 21), null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.ShiftId);            // kayıt oluştu
        Assert.Contains(result.Warnings, w => w.Contains("Günlük 11 saat"));
    }

    // ── Limit altında uyarı YOK ──
    [Fact]
    public async Task Limit_Altinda_Uyari_Olmaz()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();

        var handler = new CreateShiftHandler(db);
        // Tek vardiya 4 saat → hiçbir limit aşılmaz
        var cmd = new CreateShiftCommand(branchId, positionId, userId, D(16, 9), D(16, 13), null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.Empty(result.Warnings);
    }

    // ── Haftalık 45 saat = UYARI ──
    [Fact]
    public async Task Haftalik_45_Saat_Asiminda_Uyari_Doner()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // 15–18 Haz, her gün 11 saat = 44 saat (çakışmasız, ayrı günler)
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 9), D(15, 20));
        await SeedShiftAsync(db, branchId, positionId, userId, D(16, 9), D(16, 20));
        await SeedShiftAsync(db, branchId, positionId, userId, D(17, 9), D(17, 20));
        await SeedShiftAsync(db, branchId, positionId, userId, D(18, 9), D(18, 20));

        var handler = new CreateShiftHandler(db);
        // +2 saat (19 Haz 09–11) → toplam 46 saat (>45)
        var cmd = new CreateShiftCommand(branchId, positionId, userId, D(19, 9), D(19, 11), null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.ShiftId);
        Assert.Contains(result.Warnings, w => w.Contains("Haftalık 45 saat"));
    }

    // ── Dinlenme < 11 saat = UYARI (farklı günler) ──
    [Fact]
    public async Task Yetersiz_Dinlenme_Uyari_Doner()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // Önceki: 15 Haz 18:00–23:00
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 18), D(15, 23));

        var handler = new CreateShiftHandler(db);
        // Yeni: 16 Haz 09:00 → 23:00'ten 09:00'a 10 saat ara (<11)
        var cmd = new CreateShiftCommand(branchId, positionId, userId, D(16, 9), D(16, 13), null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.Contains(result.Warnings, w => w.Contains("Yetersiz dinlenme"));
    }

    // ── Açık vardiya (UserId=null) hiçbir kurala girmez ──
    [Fact]
    public async Task Acik_Vardiya_Kurallara_Girmez()
    {
        var (db, branchId, positionId, userId) = await SetupAsync();
        // Atanmış 12 saatlik vardiya var ama yeni vardiya AÇIK (UserId=null)
        await SeedShiftAsync(db, branchId, positionId, userId, D(15, 9), D(15, 21));

        var handler = new CreateShiftHandler(db);
        // Açık vardiya, aynı saatlerde bile → çakışma/limit kontrolü çalışmaz
        var cmd = new CreateShiftCommand(branchId, positionId, (Guid?)null, D(15, 9), D(15, 21), null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.ShiftId);
        Assert.Empty(result.Warnings);
    }
}