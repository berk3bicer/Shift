using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.ShiftNotes.List;

public class ListShiftNotesHandler
    : IRequestHandler<ListShiftNotesQuery, IReadOnlyList<ShiftNoteDto>>
{
    private readonly IShiftDbContext _db;

    public ListShiftNotesHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ShiftNoteDto>> Handle(
        ListShiftNotesQuery request, CancellationToken ct)
    {
        var query = _db.ShiftNotes.Where(n => n.BranchId == request.BranchId);

        if (request.FromDate is { } from)
            query = query.Where(n => n.NoteDate >= from);
        if (request.ToDate is { } to)
            query = query.Where(n => n.NoteDate <= to);

        // Yeni → eski: önce operasyonel gün, sonra yazılma anı (aynı gün içi sıra).
        return await query
            .OrderByDescending(n => n.NoteDate)
            .ThenByDescending(n => n.CreatedAt)
            .Select(n => new ShiftNoteDto(
                n.Id,
                n.BranchId,
                n.NoteDate,
                n.Content,
                n.CreatedByUserId,
                n.CreatedByUser != null ? n.CreatedByUser.FullName : null,
                n.CreatedAt))
            .ToListAsync(ct);
    }
}
