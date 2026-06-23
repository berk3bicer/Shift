using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Overtime.Records.Get;

public class GetOvertimeRecordHandler
    : IRequestHandler<GetOvertimeRecordQuery, OvertimeRecordDetail?>
{
    private readonly IShiftDbContext _db;

    public GetOvertimeRecordHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<OvertimeRecordDetail?> Handle(
        GetOvertimeRecordQuery request, CancellationToken ct)
    {
        // Global filter tenant izolasyonunu sağlıyor: başka tenant'ın kaydı
        // sorgulanırsa zaten "yok" gibi davranır (null döner → 404).
        // Weeks owned-collection: EF varsayılan olarak getirir (jsonb tek kolon,
        // ayrı Include gerekmez).
        var record = await _db.OvertimeRecords
            .FirstOrDefaultAsync(o => o.Id == request.Id, ct);

        if (record is null)
            return null;

        // Personel adını ayrı çekiyoruz (kayıt User navigation'ı eager tutmuyor).
        var userName = await _db.Users
            .Where(u => u.Id == record.UserId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync(ct) ?? "(bilinmiyor)";

        return new OvertimeRecordDetail(
            record.Id,
            record.UserId,
            userName,
            record.PeriodStart,
            record.PeriodEnd,
            record.TotalHours,
            record.NormalHours,
            record.OvertimeHours,
            record.AppliedHourlyRate,
            record.OvertimeMultiplier,
            record.GrossAmount,
            record.IsLocked,
            record.LockedAt,
            record.LockedByUserId,
            record.Weeks
                .OrderBy(w => w.WeekStart)
                .Select(w => new OvertimeRecordWeekItem(
                    w.WeekStart,
                    w.TotalHours,
                    w.NormalHours,
                    w.OvertimeHours))
                .ToList());
    }
}