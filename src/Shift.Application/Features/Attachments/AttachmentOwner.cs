using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Attachments;

// İliştirmenin bağlanacağı sahip varlığın bu tenant'ta var olup olmadığını doğrular.
// Polimorfik sahip → tür başına doğru tabloya bakar. UploadUrl + Confirm ortak kullanır.
internal static class AttachmentOwner
{
    public static async Task<bool> ExistsAsync(
        IShiftDbContext db, AttachmentOwnerType type, Guid ownerId, CancellationToken ct)
        => type switch
        {
            AttachmentOwnerType.Task =>
                await db.Tasks.AnyAsync(t => t.Id == ownerId, ct),
            // Run item ayrı DbSet değil → sahibi ChecklistRun üzerinden ara.
            AttachmentOwnerType.ChecklistRunItem =>
                await db.ChecklistRuns.AnyAsync(r => r.Items.Any(i => i.Id == ownerId), ct),
            _ => false
        };

    // key, bu sahip için üretilmiş prefiks'i taşıyor mu? (başka sahibin key'i geçilemesin)
    public static string KeyPrefix(AttachmentOwnerType type, Guid ownerId)
        => $"{type.ToString().ToLowerInvariant()}/{ownerId:N}/";
}
