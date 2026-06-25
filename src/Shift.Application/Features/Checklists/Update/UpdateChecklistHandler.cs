using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Checklists.Update;

public class UpdateChecklistHandler : IRequestHandler<UpdateChecklistCommand, Unit>
{
    private readonly IShiftDbContext _db;

    public UpdateChecklistHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(UpdateChecklistCommand request, CancellationToken ct)
    {
        // Şablonu çek (Items navigation'ını YÜKLEME — fixup çakışmasından kaçın; tenant filtreli).
        var checklist = await _db.Checklists.FirstOrDefaultAsync(c => c.Id == request.Id, ct);
        if (checklist is null)
            throw new InvalidOperationException("Kontrol listesi şablonu bulunamadı.");

        checklist.Name = request.Name;
        checklist.Type = request.Type;
        checklist.UpdatedAt = DateTime.UtcNow;

        // Maddeleri TAMAMEN değiştir: eskileri ayrı sorguyla çekip AÇIKÇA sil, yenileri
        // açık FK ile ekle. Navigation koleksiyonuna dokunmuyoruz → EF fixup'ı tetiklenmez
        // (sağlayıcılar arası tutarlı). Run'lar metni snapshot'ladığı için madde Id
        // değişimi geçmişi etkilemez.
        var oldItems = await _db.ChecklistItems.Where(i => i.ChecklistId == checklist.Id).ToListAsync(ct);
        _db.ChecklistItems.RemoveRange(oldItems);

        for (var index = 0; index < request.Items.Count; index++)
        {
            _db.ChecklistItems.Add(new ChecklistItem
            {
                Text = request.Items[index],
                SortOrder = index,
                ChecklistId = checklist.Id
                // TenantId interceptor'dan; yeni eklenen ITenantEntity damgalanır.
            });
        }

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}
