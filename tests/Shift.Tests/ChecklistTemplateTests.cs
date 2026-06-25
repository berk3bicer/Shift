using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Checklists.Delete;
using Shift.Application.Features.Checklists.List;
using Shift.Application.Features.Checklists.Update;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Şablon Update (madde replace) ve Delete (soft-disable). Geçmiş çalıştırmalar korunur.
public class ChecklistTemplateTests
{
    private static async Task<(ShiftDbContext db, Guid tenantId)> SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);
        return (db, tenantId);
    }

    private static async Task<Guid> AddTemplateAsync(ShiftDbContext db, Guid tenantId, params string[] items)
    {
        var checklist = new Checklist
        {
            TenantId = tenantId,
            Type = ChecklistType.Opening,
            Name = "Acilis",
            Items = items.Select((t, i) => new ChecklistItem { TenantId = tenantId, Text = t, SortOrder = i }).ToList()
        };
        db.Checklists.Add(checklist);
        await db.SaveChangesAsync();
        return checklist.Id;
    }

    // ── 1) Update: madde listesi TAMAMEN değişir (eski silinir, yeni eklenir) ──
    [Fact]
    public async Task Update_Maddeleri_Replace_Eder()
    {
        var (db, tenantId) = await SetupAsync();
        var id = await AddTemplateAsync(db, tenantId, "Eski 1", "Eski 2");

        await new UpdateChecklistHandler(db).Handle(
            new UpdateChecklistCommand(id, ChecklistType.Closing, "Kapanis",
                new[] { "Yeni 1", "Yeni 2", "Yeni 3" }),
            CancellationToken.None);

        var saved = await db.Checklists.Include(c => c.Items).FirstAsync(c => c.Id == id);
        Assert.Equal("Kapanis", saved.Name);
        Assert.Equal(ChecklistType.Closing, saved.Type);
        Assert.Equal(3, saved.Items.Count);                                  // 2 eski yok, 3 yeni
        Assert.Equal(new[] { "Yeni 1", "Yeni 2", "Yeni 3" },
            saved.Items.OrderBy(i => i.SortOrder).Select(i => i.Text));
        // Toplam madde sayısı DB'de 3 (eski 2 orphan silindi).
        Assert.Equal(3, await db.Set<ChecklistItem>().CountAsync());
    }

    // ── 2) Delete: soft-disable (IsActive=false), kayıt SİLİNMEZ ──
    [Fact]
    public async Task Delete_Soft_Disable_Eder()
    {
        var (db, tenantId) = await SetupAsync();
        var id = await AddTemplateAsync(db, tenantId, "Madde");

        await new DeleteChecklistHandler(db).Handle(
            new DeleteChecklistCommand(id), CancellationToken.None);

        var saved = await db.Checklists.FirstAsync(c => c.Id == id);
        Assert.False(saved.IsActive);                                        // pasif, ama var
        Assert.Equal(1, await db.Checklists.CountAsync());                   // silinmedi
    }

    // ── 3) Soft-disable edilen şablon default List'te GÖRÜNMEZ ──
    [Fact]
    public async Task Pasif_Sablon_Default_Listede_Gorunmez()
    {
        var (db, tenantId) = await SetupAsync();
        var id = await AddTemplateAsync(db, tenantId, "Madde");
        await new DeleteChecklistHandler(db).Handle(new DeleteChecklistCommand(id), CancellationToken.None);

        var handler = new ListChecklistsHandler(db);
        var defaultList = await handler.Handle(new ListChecklistsQuery(null, false), CancellationToken.None);
        var withInactive = await handler.Handle(new ListChecklistsQuery(null, true), CancellationToken.None);

        Assert.Empty(defaultList);                                           // pasif gizli
        Assert.Single(withInactive);                                         // IncludeInactive ile görünür
    }
}
