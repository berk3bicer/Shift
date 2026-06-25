using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ChecklistRuns.Start;

// Çalıştırmayı başlatır ve şablon maddelerini SNAPSHOT'lar. Snapshot = donmuş kopya:
// şablon sonradan değişse de bu çalıştırma o günkü hâlini korur (Gün 11/13/14 felsefesi).
public class StartChecklistRunHandler
    : IRequestHandler<StartChecklistRunCommand, StartChecklistRunResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public StartChecklistRunHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<StartChecklistRunResult> Handle(
        StartChecklistRunCommand request, CancellationToken ct)
    {
        // ── FK güvenliği: şube bu tenant'a ait mi? ──
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        // ── Şablonu maddeleriyle çek (tenant filtreli) ──
        var checklist = await _db.Checklists
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == request.ChecklistId, ct);

        if (checklist is null)
            throw new InvalidOperationException("Kontrol listesi şablonu bulunamadı.");
        if (!checklist.IsActive)
            throw new InvalidOperationException("Pasif şablondan çalıştırma başlatılamaz.");

        var runDate = request.RunDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        // ── Tekillik: aynı şube + şablon + gün için TEK çalıştırma ──
        // (DB'de unique index de var; burada erken ve anlamlı hata veriyoruz.)
        var alreadyStarted = await _db.ChecklistRuns.AnyAsync(
            r => r.BranchId == request.BranchId
              && r.ChecklistId == request.ChecklistId
              && r.RunDate == runDate, ct);
        if (alreadyStarted)
            throw new InvalidOperationException(
                "Bu şube ve gün için bu liste zaten başlatılmış.");

        var run = new ChecklistRun
        {
            // TenantId YOK — interceptor run'ı ve maddelerini (ITenantEntity) damgalar.
            BranchId = request.BranchId,
            ChecklistId = checklist.Id,
            RunDate = runDate,
            ChecklistName = checklist.Name,     // snapshot: ad
            Type = checklist.Type,              // snapshot: tür
            StartedByUserId = _currentUser.GetUserId(),

            // Maddeleri şablondan kopyala — metin + sıra donar, hepsi işaretsiz başlar.
            Items = checklist.Items
                .OrderBy(i => i.SortOrder)
                .Select(i => new ChecklistRunItem
                {
                    Text = i.Text,
                    SortOrder = i.SortOrder,
                    IsChecked = false
                })
                .ToList()
        };

        _db.ChecklistRuns.Add(run);
        await _db.SaveChangesAsync(ct);

        return new StartChecklistRunResult(run.Id, run.Items.Count);
    }
}
