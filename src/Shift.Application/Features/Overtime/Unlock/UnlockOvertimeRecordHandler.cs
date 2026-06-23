using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Overtime.Unlock;

public class UnlockOvertimeRecordHandler
    : IRequestHandler<UnlockOvertimeRecordCommand>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public UnlockOvertimeRecordHandler(
        IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(
        UnlockOvertimeRecordCommand request, CancellationToken ct)
    {
        // Global filter tenant izolasyonunu sağlıyor: başka tenant'ın kaydı
        // bulunmaz → "yok" hatası (kendi tenant'ında değilse erişemez).
        var record = await _db.OvertimeRecords
            .FirstOrDefaultAsync(o => o.Id == request.Id, ct);

        if (record is null)
            throw new InvalidOperationException("Mesai kaydı bulunamadı.");

        // Zaten açıksa anlamlı uyarı (idempotent değil — durum makinesi net olsun).
        if (!record.IsLocked)
            throw new InvalidOperationException("Bu kayıt zaten kilitli değil.");

        // Kilidi aç + audit damgala. Kim açtı → token'dan (sahtelenemez).
        record.IsLocked = false;
        record.UnlockedAt = DateTime.UtcNow;
        record.UnlockedByUserId = _currentUser.GetUserId();

        await _db.SaveChangesAsync(ct);
    }
}