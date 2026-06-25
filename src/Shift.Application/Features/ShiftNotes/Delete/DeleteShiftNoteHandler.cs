using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.ShiftNotes.Delete;

public class DeleteShiftNoteHandler : IRequestHandler<DeleteShiftNoteCommand, Unit>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public DeleteShiftNoteHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(DeleteShiftNoteCommand request, CancellationToken ct)
    {
        // global filter → sadece bu tenant'ın notu bulunur (IDOR koruması).
        var note = await _db.ShiftNotes.FirstOrDefaultAsync(n => n.Id == request.Id, ct);
        if (note is null)
            throw new InvalidOperationException("Not bulunamadı.");

        // Yetki: yönetici her notu siler; personel yalnız KENDİ notunu.
        if (!request.CanDeleteAny && note.CreatedByUserId != _currentUser.GetUserId())
            throw new InvalidOperationException("Yalnızca kendi notunuzu silebilirsiniz.");

        _db.ShiftNotes.Remove(note);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}
