using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Checklists.Delete;

// "Silme" = SOFT-DELETE (IsActive=false), hard delete DEĞİL. Neden: geçmiş çalıştırmalar
// (ChecklistRun) şablona FK Restrict ile bağlı; gerçek silme onları kıracağı için yasak.
// Soft-disable şablonu aktif kullanımdan kaldırır (List default'u IsActive süzgeçli,
// StartChecklistRun pasif şablonu reddeder) ama geçmiş çalıştırmaların bağlamı korunur.
public class DeleteChecklistHandler : IRequestHandler<DeleteChecklistCommand, Unit>
{
    private readonly IShiftDbContext _db;

    public DeleteChecklistHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(DeleteChecklistCommand request, CancellationToken ct)
    {
        // global filter → sadece bu tenant'ın şablonu (IDOR koruması).
        var checklist = await _db.Checklists.FirstOrDefaultAsync(c => c.Id == request.Id, ct);
        if (checklist is null)
            throw new InvalidOperationException("Kontrol listesi şablonu bulunamadı.");

        checklist.IsActive = false;            // soft-disable
        checklist.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}
