using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.ChecklistRuns.Check;
using Shift.Application.Features.ChecklistRuns.Start;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Kontrol listesi çalıştırması: start anında snapshot, işaretleme kim+saat kaydı,
// tüm maddeler işaretlenince otomatik tamamlanma + uncheck reopen, duplicate guard.
public class ChecklistRunTests
{
    private static async Task<(ShiftDbContext db, Guid tenantId, Guid branchId, Guid staffId)>
        SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var branch = new Branch { TenantId = tenantId, Name = "Test Sube" };
        var staff = new User { TenantId = tenantId, FullName = "Personel", Email = "p@x.com", PasswordHash = "x" };
        db.Branches.Add(branch);
        db.Users.Add(staff);
        await db.SaveChangesAsync();
        return (db, tenantId, branch.Id, staff.Id);
    }

    // Yardımcı: iki maddeli bir açılış şablonu ekler.
    private static async Task<Guid> AddTemplateAsync(ShiftDbContext db, Guid tenantId, params string[] items)
    {
        var checklist = new Checklist
        {
            TenantId = tenantId,
            Type = ChecklistType.Opening,
            Name = "Acilis Listesi",
            Items = items.Select((t, i) => new ChecklistItem { TenantId = tenantId, Text = t, SortOrder = i }).ToList()
        };
        db.Checklists.Add(checklist);
        await db.SaveChangesAsync();
        return checklist.Id;
    }

    private static StartChecklistRunHandler StartHandler(ShiftDbContext db, Guid actorId)
        => new(db, new FakeCurrentUserProvider { CurrentUserId = actorId });

    private static CheckChecklistItemHandler CheckHandler(ShiftDbContext db, Guid actorId)
        => new(db, new FakeCurrentUserProvider { CurrentUserId = actorId });

    // ── 1) Start: maddeler şablondan SNAPSHOT'lanır (işaretsiz) ──
    [Fact]
    public async Task Start_Maddeleri_Snapshotlar()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var checklistId = await AddTemplateAsync(db, tenantId, "Dolap sicakliklari", "Masalar hazir");

        var result = await StartHandler(db, staffId).Handle(
            new StartChecklistRunCommand(checklistId, branchId, new DateOnly(2026, 6, 25)),
            CancellationToken.None);

        Assert.Equal(2, result.ItemCount);
        var run = await db.ChecklistRuns.Include(r => r.Items).FirstAsync(r => r.Id == result.RunId);
        Assert.Equal("Acilis Listesi", run.ChecklistName);          // ad snapshot'landı
        Assert.Equal(ChecklistType.Opening, run.Type);
        Assert.Equal(staffId, run.StartedByUserId);
        Assert.All(run.Items, i => Assert.False(i.IsChecked));       // hepsi işaretsiz
        Assert.Null(run.CompletedAt);
    }

    // ── 2) Snapshot bağımsızlığı: şablon sonradan değişse çalıştırma DEĞİŞMEZ ──
    [Fact]
    public async Task Snapshot_Sablondan_Bagimsiz()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var checklistId = await AddTemplateAsync(db, tenantId, "Dolap sicakliklari");
        var started = await StartHandler(db, staffId).Handle(
            new StartChecklistRunCommand(checklistId, branchId, null), CancellationToken.None);

        // Şablon maddesini değiştir. (ChecklistItem aggregate-child → public DbSet yok,
        // doğrudan Set<>() ile eriş.)
        var tplItem = await db.Set<ChecklistItem>().FirstAsync(i => i.ChecklistId == checklistId);
        tplItem.Text = "Buzdolabi sicakliklari (yeni)";
        await db.SaveChangesAsync();

        var run = await db.ChecklistRuns.Include(r => r.Items).FirstAsync(r => r.Id == started.RunId);
        Assert.Equal("Dolap sicakliklari", run.Items[0].Text);       // çalıştırma eski metni korudu
    }

    // ── 3) İşaretleme: kim + saat otomatik kaydedilir ──
    [Fact]
    public async Task Isaretleme_Kisi_Ve_Saat_Kaydeder()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var checklistId = await AddTemplateAsync(db, tenantId, "Dolap", "Masalar");
        var started = await StartHandler(db, staffId).Handle(
            new StartChecklistRunCommand(checklistId, branchId, null), CancellationToken.None);
        var firstItem = (await db.ChecklistRuns.Include(r => r.Items)
            .FirstAsync(r => r.Id == started.RunId)).Items.First();

        var result = await CheckHandler(db, staffId).Handle(
            new CheckChecklistItemCommand(started.RunId, firstItem.Id, true, "4 derece"),
            CancellationToken.None);

        var saved = await db.ChecklistRuns.Include(r => r.Items)
            .FirstAsync(r => r.Id == started.RunId);
        var item = saved.Items.First(i => i.Id == firstItem.Id);
        Assert.True(item.IsChecked);
        Assert.Equal(staffId, item.CheckedByUserId);                 // kim
        Assert.NotNull(item.CheckedAt);                              // ne zaman
        Assert.Equal("4 derece", item.Note);
        Assert.Equal(1, result.CheckedCount);
        Assert.False(result.IsCompleted);                           // 1/2 → henüz değil
    }

    // ── 4) Tüm maddeler işaretlenince çalıştırma OTOMATİK tamamlanır ──
    [Fact]
    public async Task Tum_Maddeler_Isaretlenince_Otomatik_Tamamlanir()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var checklistId = await AddTemplateAsync(db, tenantId, "Dolap", "Masalar");
        var started = await StartHandler(db, staffId).Handle(
            new StartChecklistRunCommand(checklistId, branchId, null), CancellationToken.None);
        var items = (await db.ChecklistRuns.Include(r => r.Items)
            .FirstAsync(r => r.Id == started.RunId)).Items.ToList();

        await CheckHandler(db, staffId).Handle(
            new CheckChecklistItemCommand(started.RunId, items[0].Id, true, null), CancellationToken.None);
        var last = await CheckHandler(db, staffId).Handle(
            new CheckChecklistItemCommand(started.RunId, items[1].Id, true, null), CancellationToken.None);

        Assert.True(last.IsCompleted);
        Assert.Equal(2, last.CheckedCount);
        var run = await db.ChecklistRuns.FirstAsync(r => r.Id == started.RunId);
        Assert.NotNull(run.CompletedAt);
        Assert.Equal(staffId, run.CompletedByUserId);               // tamamlayan = son işaretleyen
    }

    // ── 5) Tamamlanmış çalıştırmada madde geri sökülürse tamamlanma GERİ ALINIR ──
    [Fact]
    public async Task Madde_Geri_Sokulunce_Tamamlanma_Geri_Alinir()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var checklistId = await AddTemplateAsync(db, tenantId, "Dolap", "Masalar");
        var started = await StartHandler(db, staffId).Handle(
            new StartChecklistRunCommand(checklistId, branchId, null), CancellationToken.None);
        var items = (await db.ChecklistRuns.Include(r => r.Items)
            .FirstAsync(r => r.Id == started.RunId)).Items.ToList();

        // İkisini işaretle (tamamlanır), sonra birini geri sök.
        await CheckHandler(db, staffId).Handle(
            new CheckChecklistItemCommand(started.RunId, items[0].Id, true, null), CancellationToken.None);
        await CheckHandler(db, staffId).Handle(
            new CheckChecklistItemCommand(started.RunId, items[1].Id, true, null), CancellationToken.None);
        var reopened = await CheckHandler(db, staffId).Handle(
            new CheckChecklistItemCommand(started.RunId, items[1].Id, false, null), CancellationToken.None);

        Assert.False(reopened.IsCompleted);
        var run = await db.ChecklistRuns.Include(r => r.Items).FirstAsync(r => r.Id == started.RunId);
        Assert.Null(run.CompletedAt);                               // tamamlanma temizlendi
        Assert.Null(run.CompletedByUserId);
        var unchecked2 = run.Items.First(i => i.Id == items[1].Id);
        Assert.Null(unchecked2.CheckedByUserId);                    // madde izi de temizlendi
        Assert.Null(unchecked2.CheckedAt);
    }

    // ── 6) Aynı şube+şablon+gün için ikinci kez başlatma reddedilir ──
    [Fact]
    public async Task Ayni_Gun_Ikinci_Start_Reddedilir()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var checklistId = await AddTemplateAsync(db, tenantId, "Dolap");
        var date = new DateOnly(2026, 6, 25);
        await StartHandler(db, staffId).Handle(
            new StartChecklistRunCommand(checklistId, branchId, date), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            StartHandler(db, staffId).Handle(
                new StartChecklistRunCommand(checklistId, branchId, date), CancellationToken.None));
    }
}
