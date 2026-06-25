using MediatR;

namespace Shift.Application.Features.ShiftNotes.List;

// Bir şubenin not akışını getirir (handoff feed). Tarih aralığı opsiyonel; verilmezse
// hepsi. Yeni → eski sıralı (en güncel handoff üstte).
public record ListShiftNotesQuery(
    Guid BranchId,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<ShiftNoteDto>>;

public record ShiftNoteDto(
    Guid Id,
    Guid BranchId,
    DateOnly NoteDate,
    string Content,
    Guid? CreatedByUserId,
    string? CreatedByUserName,   // yazar silinmişse null
    DateTime CreatedAt
);
