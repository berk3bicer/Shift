using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Attachments.Confirm;
using Shift.Application.Features.Attachments.List;
using Shift.Application.Features.Attachments.UploadUrl;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Fotoğraf/dosya iliştirme: presigned URL üretimi (owner doğrulama + key prefiks),
// Confirm (kayıt + token yükleyen + key sahip eşleşmesi), List (indirme URL'leri).
public class AttachmentTests
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

        var branch = new Branch { TenantId = tenantId, Name = "Sube" };
        var staff = new User { TenantId = tenantId, FullName = "Personel", Email = "p@x.com", PasswordHash = "x" };
        db.Branches.Add(branch);
        db.Users.Add(staff);
        await db.SaveChangesAsync();
        return (db, tenantId, branch.Id, staff.Id);
    }

    private static async Task<Guid> AddTaskAsync(ShiftDbContext db, Guid tenantId, Guid branchId)
    {
        var task = new TaskItem
        {
            TenantId = tenantId,
            BranchId = branchId,
            Title = "Gorev",
            Category = TaskCategory.Cleaning,
            Status = TaskItemStatus.Done
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return task.Id;
    }

    private static CreateUploadUrlHandler UploadHandler(ShiftDbContext db)
        => new(db, new FakeFileStorage());

    private static ConfirmAttachmentHandler ConfirmHandler(ShiftDbContext db, Guid actorId)
        => new(db, new FakeCurrentUserProvider { CurrentUserId = actorId });

    // ── 1) UploadUrl: geçerli görev → key sahip prefiksini taşır, URL üretilir ──
    [Fact]
    public async Task UploadUrl_Gecerli_Owner_Key_Ve_Url_Uretir()
    {
        var (db, tenantId, branchId, _) = await SetupAsync();
        var taskId = await AddTaskAsync(db, tenantId, branchId);

        var result = await UploadHandler(db).Handle(
            new CreateUploadUrlCommand(AttachmentOwnerType.Task, taskId, "image/jpeg", "kanit.jpg"),
            CancellationToken.None);

        Assert.StartsWith($"task/{taskId:N}/", result.Key);   // sahip prefiksi
        Assert.EndsWith(".jpg", result.Key);                  // uzantı korundu
        Assert.Equal("PUT", result.Method);
        Assert.Contains(result.Key, result.UploadUrl);
    }

    // ── 2) UploadUrl: olmayan owner → reddedilir ──
    [Fact]
    public async Task UploadUrl_Gecersiz_Owner_Reddedilir()
    {
        var (db, _, _, _) = await SetupAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            UploadHandler(db).Handle(
                new CreateUploadUrlCommand(AttachmentOwnerType.Task, Guid.NewGuid(), "image/jpeg", "x.jpg"),
                CancellationToken.None));
    }

    // ── 3) Confirm: kayıt oluşur, yükleyen token'dan damgalanır ──
    [Fact]
    public async Task Confirm_Kayit_Olusturur_Token_Yukleyen()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, tenantId, branchId);
        var up = await UploadHandler(db).Handle(
            new CreateUploadUrlCommand(AttachmentOwnerType.Task, taskId, "image/jpeg", "k.jpg"),
            CancellationToken.None);

        var result = await ConfirmHandler(db, staffId).Handle(
            new ConfirmAttachmentCommand(AttachmentOwnerType.Task, taskId, up.Key, "image/jpeg", "k.jpg"),
            CancellationToken.None);

        var saved = await db.Attachments.FirstAsync(a => a.Id == result.AttachmentId);
        Assert.Equal(taskId, saved.OwnerId);
        Assert.Equal(AttachmentOwnerType.Task, saved.OwnerType);
        Assert.Equal(up.Key, saved.StorageKey);
        Assert.Equal(staffId, saved.UploadedByUserId);
    }

    // ── 4) Confirm: key BAŞKA sahibe ait prefiks taşıyorsa reddedilir ──
    [Fact]
    public async Task Confirm_Yanlis_Owner_Key_Reddedilir()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, tenantId, branchId);
        // Başka bir sahip Id'siyle üretilmiş gibi bir key.
        var foreignKey = $"task/{Guid.NewGuid():N}/abc.jpg";

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            ConfirmHandler(db, staffId).Handle(
                new ConfirmAttachmentCommand(AttachmentOwnerType.Task, taskId, foreignKey, "image/jpeg", "k.jpg"),
                CancellationToken.None));
    }

    // ── 5) List: iliştirmeler indirme URL'leriyle gelir ──
    [Fact]
    public async Task List_Indirme_Urlleriyle_Gelir()
    {
        var (db, tenantId, branchId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, tenantId, branchId);
        var up = await UploadHandler(db).Handle(
            new CreateUploadUrlCommand(AttachmentOwnerType.Task, taskId, "image/jpeg", "k.jpg"),
            CancellationToken.None);
        await ConfirmHandler(db, staffId).Handle(
            new ConfirmAttachmentCommand(AttachmentOwnerType.Task, taskId, up.Key, "image/jpeg", "k.jpg"),
            CancellationToken.None);

        var list = await new ListAttachmentsHandler(db, new FakeFileStorage()).Handle(
            new ListAttachmentsQuery(AttachmentOwnerType.Task, taskId), CancellationToken.None);

        Assert.Single(list);
        Assert.Equal($"https://fake/download/{up.Key}", list[0].DownloadUrl);
        Assert.Equal("Personel", list[0].UploadedByUserName);
    }

    // ── 6) ChecklistRunItem sahibi: run maddesi üzerinden doğrulanır ──
    [Fact]
    public async Task UploadUrl_ChecklistRunItem_Owner_Calisir()
    {
        var (db, tenantId, branchId, _) = await SetupAsync();
        var run = new ChecklistRun
        {
            TenantId = tenantId,
            BranchId = branchId,
            ChecklistId = Guid.NewGuid(),
            ChecklistName = "Acilis",
            RunDate = new DateOnly(2026, 6, 25),
            Items = { new ChecklistRunItem { TenantId = tenantId, Text = "Madde", SortOrder = 0 } }
        };
        db.ChecklistRuns.Add(run);
        await db.SaveChangesAsync();
        var itemId = run.Items.First().Id;

        var result = await UploadHandler(db).Handle(
            new CreateUploadUrlCommand(AttachmentOwnerType.ChecklistRunItem, itemId, "image/png", "p.png"),
            CancellationToken.None);

        Assert.StartsWith($"checklistrunitem/{itemId:N}/", result.Key);
    }
}
