using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.ChecklistRuns.Check;

// Çekirdek aksiyon. İşaretleme = "kim + ne zaman" otomatik damga (token'dan). Tüm
// maddeler işaretlenince çalıştırma OTOMATİK tamamlanır; bir madde geri sökülürse
// tamamlanma geri alınır (giriş/çıkış simetrisi — Kanban Done reopen ile aynı mantık).
public class CheckChecklistItemHandler
    : IRequestHandler<CheckChecklistItemCommand, CheckChecklistItemResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public CheckChecklistItemHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CheckChecklistItemResult> Handle(
        CheckChecklistItemCommand request, CancellationToken ct)
    {
        // Çalıştırmayı maddeleriyle çek (tenant filtreli).
        var run = await _db.ChecklistRuns
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == request.RunId, ct);

        if (run is null)
            throw new InvalidOperationException("Kontrol listesi çalıştırması bulunamadı.");

        var item = run.Items.FirstOrDefault(i => i.Id == request.ItemId);
        if (item is null)
            throw new InvalidOperationException("Madde bu çalıştırmada bulunamadı.");

        var now = DateTime.UtcNow;

        // ── Madde durumu + "kim/ne zaman" damgası ──
        item.IsChecked = request.IsChecked;
        item.Note = request.Note;
        if (request.IsChecked)
        {
            item.CheckedByUserId = _currentUser.GetUserId();
            item.CheckedAt = now;
        }
        else
        {
            // İşaret kaldırıldı → kim/ne zaman izini de temizle (tutarlılık).
            item.CheckedByUserId = null;
            item.CheckedAt = null;
        }

        // ── Çalıştırma tamamlanması: tüm maddeler işaretliyse otomatik tamamla ──
        var allChecked = run.Items.All(i => i.IsChecked);

        if (allChecked && run.CompletedAt is null)
        {
            run.CompletedAt = now;
            run.CompletedByUserId = _currentUser.GetUserId();
        }
        else if (!allChecked && run.CompletedAt is not null)
        {
            // Tamamlanmış çalıştırmada bir madde geri söküldü → tamamlanmayı geri al.
            run.CompletedAt = null;
            run.CompletedByUserId = null;
        }

        run.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        return new CheckChecklistItemResult(
            run.Id,
            run.Items.Count(i => i.IsChecked),
            run.Items.Count,
            run.CompletedAt is not null);
    }
}
