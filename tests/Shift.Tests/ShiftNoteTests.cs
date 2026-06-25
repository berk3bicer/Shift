using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.ShiftNotes.Create;
using Shift.Application.Features.ShiftNotes.Delete;
using Shift.Application.Features.ShiftNotes.List;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Vardiya notu (handoff feed): oluşturma yazar+gün damgası, feed sırası (yeni→eski),
// silme yetki kuralı (yönetici her notu / personel yalnız kendi notu).
public class ShiftNoteTests
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

    private static CreateShiftNoteHandler CreateHandler(ShiftDbContext db, Guid actorId)
        => new(db, new FakeCurrentUserProvider { CurrentUserId = actorId });

    private static DeleteShiftNoteHandler DeleteHandler(ShiftDbContext db, Guid actorId)
        => new(db, new FakeCurrentUserProvider { CurrentUserId = actorId });

    // ── 1) Oluşturma: yazar (token) + gün damgalanır; gün verilmezse bugün ──
    [Fact]
    public async Task Olusturma_Yazar_Ve_Gun_Damgalar()
    {
        var (db, _, branchId, staffId) = await SetupAsync();

        var result = await CreateHandler(db, staffId).Handle(
            new CreateShiftNoteCommand(branchId, new DateOnly(2026, 6, 25), "Badem sutu bitti"),
            CancellationToken.None);

        var note = await db.ShiftNotes.FirstAsync(n => n.Id == result.NoteId);
        Assert.Equal(staffId, note.CreatedByUserId);
        Assert.Equal(new DateOnly(2026, 6, 25), note.NoteDate);
        Assert.Equal("Badem sutu bitti", note.Content);
    }

    // ── 2) Feed: aynı şubenin notları yeni → eski sıralı gelir ──
    [Fact]
    public async Task Feed_Yeni_Eski_Sirali()
    {
        var (db, _, branchId, staffId) = await SetupAsync();
        var handler = CreateHandler(db, staffId);
        await handler.Handle(new CreateShiftNoteCommand(branchId, new DateOnly(2026, 6, 24), "Dun"), CancellationToken.None);
        await handler.Handle(new CreateShiftNoteCommand(branchId, new DateOnly(2026, 6, 26), "Bugun"), CancellationToken.None);
        await handler.Handle(new CreateShiftNoteCommand(branchId, new DateOnly(2026, 6, 25), "Ara"), CancellationToken.None);

        var feed = await new ListShiftNotesHandler(db).Handle(
            new ListShiftNotesQuery(branchId, null, null), CancellationToken.None);

        Assert.Equal(3, feed.Count);
        Assert.Equal("Bugun", feed[0].Content);   // 26
        Assert.Equal("Ara", feed[1].Content);      // 25
        Assert.Equal("Dun", feed[2].Content);      // 24
        Assert.Equal("Personel", feed[0].CreatedByUserName);
    }

    // ── 3) Tarih aralığı filtresi ──
    [Fact]
    public async Task Feed_Tarih_Araligi_Filtreler()
    {
        var (db, _, branchId, staffId) = await SetupAsync();
        var handler = CreateHandler(db, staffId);
        await handler.Handle(new CreateShiftNoteCommand(branchId, new DateOnly(2026, 6, 20), "Eski"), CancellationToken.None);
        await handler.Handle(new CreateShiftNoteCommand(branchId, new DateOnly(2026, 6, 25), "Icinde"), CancellationToken.None);

        var feed = await new ListShiftNotesHandler(db).Handle(
            new ListShiftNotesQuery(branchId, new DateOnly(2026, 6, 24), new DateOnly(2026, 6, 26)),
            CancellationToken.None);

        Assert.Single(feed);
        Assert.Equal("Icinde", feed[0].Content);
    }

    // ── 4) Silme: personel KENDİ notunu siler (CanDeleteAny=false) ──
    [Fact]
    public async Task Personel_Kendi_Notunu_Siler()
    {
        var (db, _, branchId, staffId) = await SetupAsync();
        var created = await CreateHandler(db, staffId).Handle(
            new CreateShiftNoteCommand(branchId, null, "Benim notum"), CancellationToken.None);

        await DeleteHandler(db, staffId).Handle(
            new DeleteShiftNoteCommand(created.NoteId, CanDeleteAny: false), CancellationToken.None);

        Assert.Equal(0, await db.ShiftNotes.CountAsync());
    }

    // ── 5) Silme: personel BAŞKASININ notunu silemez (CanDeleteAny=false) ──
    [Fact]
    public async Task Personel_Baskasinin_Notunu_Silemez()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        // Başka bir personelin notu.
        var other = new User { TenantId = tenantId, FullName = "Baska", Email = "b@x.com", PasswordHash = "x" };
        db.Users.Add(other);
        await db.SaveChangesAsync();
        var created = await CreateHandler(db, other.Id).Handle(
            new CreateShiftNoteCommand(branchId, null, "Baskasinin notu"), CancellationToken.None);

        // staff (sahibi değil) + CanDeleteAny=false → reddedilir.
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DeleteHandler(db, staffId).Handle(
                new DeleteShiftNoteCommand(created.NoteId, CanDeleteAny: false), CancellationToken.None));
        Assert.Equal(1, await db.ShiftNotes.CountAsync());   // silinmedi
    }

    // ── 6) Silme: yönetici BAŞKASININ notunu silebilir (CanDeleteAny=true) ──
    [Fact]
    public async Task Yonetici_Baskasinin_Notunu_Silebilir()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var created = await CreateHandler(db, staffId).Handle(
            new CreateShiftNoteCommand(branchId, null, "Personel notu"), CancellationToken.None);

        // Yönetici (managerId) + CanDeleteAny=true → silebilir.
        var managerId = Guid.NewGuid();
        await DeleteHandler(db, managerId).Handle(
            new DeleteShiftNoteCommand(created.NoteId, CanDeleteAny: true), CancellationToken.None);

        Assert.Equal(0, await db.ShiftNotes.CountAsync());
    }
}
