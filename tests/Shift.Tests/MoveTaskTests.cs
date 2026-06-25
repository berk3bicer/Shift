using Microsoft.EntityFrameworkCore;
using Shift.Application.Features.Tasks.Move;
using Shift.Domain.Entities;
using Shift.Infrastructure.Persistence;

namespace Shift.Tests;

// Kanban state machine (MoveTaskHandler): serbest hareket politikası + Done yan
// etkileri (tamamlanma damgası + bildirim) + reopen temizliği + aynı-duruma guard.
public class MoveTaskTests
{
    // Ortak kurulum: tenant + şube + iki kullanıcı (oluşturan yönetici + atanan personel).
    private static async Task<(ShiftDbContext db, Guid branchId, Guid creatorId, Guid staffId)>
        SetupAsync()
    {
        var tenantId = Guid.NewGuid();
        var tenantProvider = new FakeTenantProvider { CurrentTenantId = tenantId };
        var options = new DbContextOptionsBuilder<ShiftDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new ShiftDbContext(options, tenantProvider);

        var branch = new Branch { TenantId = tenantId, Name = "Test Sube" };
        var creator = new User { TenantId = tenantId, FullName = "Yonetici", Email = "y@x.com", PasswordHash = "x" };
        var staff = new User { TenantId = tenantId, FullName = "Personel", Email = "p@x.com", PasswordHash = "x" };
        db.Branches.Add(branch);
        db.Users.AddRange(creator, staff);
        await db.SaveChangesAsync();
        return (db, branch.Id, creator.Id, staff.Id);
    }

    // Yardımcı: belirli durumda bir görev ekler. creatorId = oluşturan (bildirim hedefi).
    private static async Task<Guid> AddTaskAsync(
        ShiftDbContext db, Guid branchId, Guid creatorId, TaskItemStatus status)
    {
        var task = new TaskItem
        {
            BranchId = branchId,
            Title = "Masalari sil",
            Category = TaskCategory.Cleaning,
            Priority = TaskPriority.Medium,
            Status = status,
            CreatedByUserId = creatorId
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return task.Id;
    }

    // Yardımcı: hareketi yapan kullanıcıyı (token) belirleyerek handler kur.
    private static MoveTaskHandler HandlerAs(ShiftDbContext db, Guid actorId)
        => new(db, new FakeCurrentUserProvider { CurrentUserId = actorId });

    // ── 1) ToDo → InProgress: StartedAt damgalanır, Done yan etkisi yok ──
    [Fact]
    public async Task ToDo_InProgress_StartedAt_Damgalanir()
    {
        var (db, branchId, creatorId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, branchId, creatorId, TaskItemStatus.ToDo);

        var result = await HandlerAs(db, staffId).Handle(
            new MoveTaskCommand(taskId, TaskItemStatus.InProgress), CancellationToken.None);

        var saved = await db.Tasks.FirstAsync(t => t.Id == taskId);
        Assert.Equal("InProgress", result.Status);
        Assert.Equal(TaskItemStatus.InProgress, saved.Status);
        Assert.NotNull(saved.StartedAt);
        Assert.Null(saved.CompletedAt);
        Assert.Equal(0, await db.Notifications.CountAsync());
    }

    // ── 2) InProgress → Done: CompletedAt + CompletedBy + oluşturana bildirim ──
    [Fact]
    public async Task InProgress_Done_Tamamlanma_Damgasi_Ve_Bildirim()
    {
        var (db, branchId, creatorId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, branchId, creatorId, TaskItemStatus.InProgress);

        await HandlerAs(db, staffId).Handle(
            new MoveTaskCommand(taskId, TaskItemStatus.Done), CancellationToken.None);

        var saved = await db.Tasks.FirstAsync(t => t.Id == taskId);
        Assert.Equal(TaskItemStatus.Done, saved.Status);
        Assert.NotNull(saved.CompletedAt);
        Assert.Equal(staffId, saved.CompletedByUserId);          // tamamlayan = hareketi yapan
        // Oluşturana (yönetici) "tamamlandı" bildirimi.
        Assert.Equal(1, await db.Notifications.CountAsync(
            n => n.UserId == creatorId && n.Type == NotificationType.TaskCompleted));
    }

    // ── 3) ToDo → Done (atlama serbest): hızlı bitir, yine tamamlanma + bildirim ──
    [Fact]
    public async Task ToDo_Done_Atlama_Serbest_Tamamlanir()
    {
        var (db, branchId, creatorId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, branchId, creatorId, TaskItemStatus.ToDo);

        await HandlerAs(db, staffId).Handle(
            new MoveTaskCommand(taskId, TaskItemStatus.Done), CancellationToken.None);

        var saved = await db.Tasks.FirstAsync(t => t.Id == taskId);
        Assert.Equal(TaskItemStatus.Done, saved.Status);
        Assert.NotNull(saved.CompletedAt);
        Assert.Equal(1, await db.Notifications.CountAsync(n => n.Type == NotificationType.TaskCompleted));
    }

    // ── 4) Done → InProgress (reopen): tamamlanma izi TEMİZLENİR ──
    [Fact]
    public async Task Done_InProgress_Reopen_Tamamlanma_Temizlenir()
    {
        var (db, branchId, creatorId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, branchId, creatorId, TaskItemStatus.ToDo);

        // ToDo → Done (tamamla) → InProgress (geri aç)
        await HandlerAs(db, staffId).Handle(
            new MoveTaskCommand(taskId, TaskItemStatus.Done), CancellationToken.None);
        await HandlerAs(db, staffId).Handle(
            new MoveTaskCommand(taskId, TaskItemStatus.InProgress), CancellationToken.None);

        var saved = await db.Tasks.FirstAsync(t => t.Id == taskId);
        Assert.Equal(TaskItemStatus.InProgress, saved.Status);
        Assert.Null(saved.CompletedAt);                          // reopen temizledi
        Assert.Null(saved.CompletedByUserId);
    }

    // ── 5) GUARD: aynı duruma taşıma reddedilir ──
    [Fact]
    public async Task Ayni_Duruma_Tasima_Reddedilir()
    {
        var (db, branchId, creatorId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, branchId, creatorId, TaskItemStatus.ToDo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            HandlerAs(db, staffId).Handle(
                new MoveTaskCommand(taskId, TaskItemStatus.ToDo), CancellationToken.None));
    }

    // ── 6) StartedAt İLK girişte sabitlenir, sonraki InProgress dönüşünde EZİLMEZ ──
    [Fact]
    public async Task StartedAt_Ilk_Giriste_Sabitlenir_Ezilmez()
    {
        var (db, branchId, creatorId, staffId) = await SetupAsync();
        var taskId = await AddTaskAsync(db, branchId, creatorId, TaskItemStatus.ToDo);
        var handler = HandlerAs(db, staffId);

        // ToDo → InProgress (ilk başlangıç damgası)
        await handler.Handle(new MoveTaskCommand(taskId, TaskItemStatus.InProgress), CancellationToken.None);
        var firstStarted = (await db.Tasks.FirstAsync(t => t.Id == taskId)).StartedAt;

        // InProgress → Done → InProgress (ikinci kez InProgress)
        await handler.Handle(new MoveTaskCommand(taskId, TaskItemStatus.Done), CancellationToken.None);
        await handler.Handle(new MoveTaskCommand(taskId, TaskItemStatus.InProgress), CancellationToken.None);
        var secondStarted = (await db.Tasks.FirstAsync(t => t.Id == taskId)).StartedAt;

        Assert.Equal(firstStarted, secondStarted);               // ilk damga korundu
    }

    // ── 7) Oluşturanı bilinmeyen görev Done olunca bildirim ATILMAZ (null guard) ──
    [Fact]
    public async Task Olusturani_Null_Gorev_Done_Bildirim_Atmaz()
    {
        var (db, branchId, _, staffId) = await SetupAsync();
        // CreatedByUserId null bir görev (ör. sistem/seed kaynaklı).
        var task = new TaskItem
        {
            BranchId = branchId,
            Title = "Sahipsiz gorev",
            Category = TaskCategory.Service,
            Status = TaskItemStatus.InProgress,
            CreatedByUserId = null
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        await HandlerAs(db, staffId).Handle(
            new MoveTaskCommand(task.Id, TaskItemStatus.Done), CancellationToken.None);

        var saved = await db.Tasks.FirstAsync(t => t.Id == task.Id);
        Assert.NotNull(saved.CompletedAt);                       // tamamlanma yine damgalanır
        Assert.Equal(0, await db.Notifications.CountAsync());    // ama bildirim yok
    }
}
