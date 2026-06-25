using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftNotes.Create;

public class CreateShiftNoteHandler
    : IRequestHandler<CreateShiftNoteCommand, CreateShiftNoteResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public CreateShiftNoteHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateShiftNoteResult> Handle(
        CreateShiftNoteCommand request, CancellationToken ct)
    {
        // FK güvenliği: şube bu tenant'a ait mi? (global filter altında)
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
        if (!branchExists)
            throw new InvalidOperationException("Şube bulunamadı.");

        var note = new ShiftNote
        {
            // TenantId YOK — interceptor damgalar.
            BranchId = request.BranchId,
            NoteDate = request.NoteDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Content = request.Content,
            CreatedByUserId = _currentUser.GetUserId()   // kim bıraktı — token'dan
        };

        _db.ShiftNotes.Add(note);
        await _db.SaveChangesAsync(ct);

        return new CreateShiftNoteResult(note.Id);
    }
}
