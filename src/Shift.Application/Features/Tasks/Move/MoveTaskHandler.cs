using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Tasks.Move;

// Kanban state machine. Politika: SERBEST HAREKET (Jira benzeri) — her sütun → her
// sütun geçilebilir. Tek guard: aynı duruma geçiş reddedilir (anlamsız no-op).
// Değer, durumun kendisinde değil yan etkilerde: Done'a giriş/çıkış zaman damgası +
// tamamlanma bildirimini tetikler. Durum + yan etki tek SaveChanges'te → atomik.
public class MoveTaskHandler : IRequestHandler<MoveTaskCommand, MoveTaskResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public MoveTaskHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MoveTaskResult> Handle(MoveTaskCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.Id, ct);
        if (task is null)
            throw new InvalidOperationException("Görev bulunamadı.");

        var from = task.Status;
        var to = request.NewStatus;

        // ── GUARD: aynı sütuna taşıma anlamsız ──
        if (from == to)
            throw new InvalidOperationException(
                $"Görev zaten '{from}' durumunda.");

        var now = DateTime.UtcNow;

        // ── YAN ETKİ 1: Done'a GİRİŞ → tamamlandı damgası + bildirim ──
        // (from ≠ Done garantili çünkü from == to yukarıda elendi.)
        if (to == TaskItemStatus.Done)
        {
            task.CompletedAt = now;
            task.CompletedByUserId = _currentUser.GetUserId();

            // Görevi oluşturana/atayana "tamamlandı" bildirimi (spec 2.1).
            // Oluşturan bilinmiyorsa (CreatedByUserId null) bildirim atlanır.
            if (task.CreatedByUserId is { } creatorId)
            {
                _db.Notifications.Add(new Notification
                {
                    UserId = creatorId,
                    Type = NotificationType.TaskCompleted,
                    Message = "Atadığın görev tamamlandı.",
                    RelatedEntityId = task.Id,
                    IsRead = false
                });
            }
        }

        // ── YAN ETKİ 2: Done'dan ÇIKIŞ (reopen) → tamamlanma izini temizle ──
        if (from == TaskItemStatus.Done)
        {
            task.CompletedAt = null;
            task.CompletedByUserId = null;
        }

        // ── YAN ETKİ 3: InProgress'e İLK giriş → başlangıç damgası ──
        // Bir kez damgalanır, sonraki InProgress dönüşlerinde ezilmez ("ilk ne zaman
        // başlandı" sabit kalsın).
        if (to == TaskItemStatus.InProgress && task.StartedAt is null)
            task.StartedAt = now;

        task.Status = to;
        task.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);

        return new MoveTaskResult(task.Id, task.Status.ToString());
    }
}
