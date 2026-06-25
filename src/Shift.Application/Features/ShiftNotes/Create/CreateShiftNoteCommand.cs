using MediatR;

namespace Shift.Application.Features.ShiftNotes.Create;

// Vardiya notu (handoff) bırakır. NoteDate verilmezse bugün (UTC). Yazar token'dan.
public record CreateShiftNoteCommand(
    Guid BranchId,
    DateOnly? NoteDate,
    string Content
) : IRequest<CreateShiftNoteResult>;

public record CreateShiftNoteResult(Guid NoteId);
