using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Overtime.Records.List;

public class ListOvertimeRecordsHandler
    : IRequestHandler<ListOvertimeRecordsQuery, IReadOnlyList<OvertimeRecordListItem>>
{
    private readonly IShiftDbContext _db;

    public ListOvertimeRecordsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<OvertimeRecordListItem>> Handle(
        ListOvertimeRecordsQuery request, CancellationToken ct)
    {
        // Global filter zaten tenant izolasyonunu sağlıyor. Buradaki filtreler
        // opsiyonel daraltma. Join ile personel adını alıyoruz (liste okunabilirliği).
        var query = _db.OvertimeRecords.AsQueryable();

        if (request.UserId is { } uid)
            query = query.Where(o => o.UserId == uid);

        // Dönem filtresi: kaydın dönemi verilen aralıkla KESİŞİYORSA dahil et.
        // (PeriodStart <= To) && (PeriodEnd >= From) — klasik aralık kesişimi.
        if (request.From is { } from)
            query = query.Where(o => o.PeriodEnd >= from);
        if (request.To is { } to)
            query = query.Where(o => o.PeriodStart <= to);

        // Personel adı için User'a join. Weeks'i SEÇMİYORUZ (liste hafif).
        // En yeni dönem en üstte (PeriodStart azalan).
        var items = await query
            .OrderByDescending(o => o.PeriodStart)
            .Join(_db.Users,
                o => o.UserId,
                u => u.Id,
                (o, u) => new OvertimeRecordListItem(
                    o.Id,
                    o.UserId,
                    u.FullName,
                    o.PeriodStart,
                    o.PeriodEnd,
                    o.TotalHours,
                    o.NormalHours,
                    o.OvertimeHours,
                    o.AppliedHourlyRate,
                    o.OvertimeMultiplier,
                    o.NightPremium,
                    o.WeekendPremium,
                    o.GrossAmount,
                    o.IsLocked,
                    o.LockedAt,
                    o.UnlockedAt))
            .ToListAsync(ct);

        return items;
    }
}