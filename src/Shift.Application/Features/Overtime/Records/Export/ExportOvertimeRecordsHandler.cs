using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Services.Csv;

namespace Shift.Application.Features.Overtime.Records.Export;

public class ExportOvertimeRecordsHandler
    : IRequestHandler<ExportOvertimeRecordsQuery, CsvFileResult>
{
    private readonly IShiftDbContext _db;

    public ExportOvertimeRecordsHandler(IShiftDbContext db)
    {
        _db = db;
    }

    public async Task<CsvFileResult> Handle(
        ExportOvertimeRecordsQuery request, CancellationToken ct)
    {
        // Global query filter zaten tenant izolasyonunu sağlıyor (başka tenant'ın
        // kaydı hiç gelmez). Buradaki filtreler opsiyonel daraltma.
        var query = _db.OvertimeRecords.AsQueryable();

        // KİLİT SÜZGECİ — export'un liste ucundan tek farkı. Sadece donmuş kayıtlar.
        query = query.Where(o => o.IsLocked);

        if (request.UserId is { } uid)
            query = query.Where(o => o.UserId == uid);

        // Dönem kesişimi: (PeriodEnd >= from) && (PeriodStart <= to). Liste ile aynı kalıp.
        if (request.From is { } from)
            query = query.Where(o => o.PeriodEnd >= from);
        if (request.To is { } to)
            query = query.Where(o => o.PeriodStart <= to);

        // Personel adı için User'a join. Weeks taşımıyoruz (bordro satırı özet).
        // Sıralama: önce personel adı, sonra dönem — bordro okunabilirliği.
        var rows = await query
            .Join(_db.Users,
                o => o.UserId,
                u => u.Id,
                (o, u) => new
                {
                    u.FullName,
                    o.PeriodStart,
                    o.PeriodEnd,
                    o.NormalHours,
                    o.OvertimeHours,
                    o.TotalHours,
                    o.GrossAmount,
                    o.LockedAt
                })
            .OrderBy(x => x.FullName)
            .ThenBy(x => x.PeriodStart)
            .ToListAsync(ct);

        // ── CSV satırlarını kur ──
        // Başlık: muhasebe yazılımının tanıyacağı sade kolonlar. Türkçe başlık;
        // Logo/Mikro import eşlemesinde okunabilir olsun.
        var header = new[]
        {
            "Personel",
            "Donem Baslangic",
            "Donem Bitis",
            "Normal Saat",
            "Fazla Mesai Saat",
            "Toplam Saat",
            "Brut Tutar",
            "Kapanis Tarihi"
        };

        // Kültürden bağımsız format: tarih ISO (yyyy-MM-dd), ondalık NOKTA (45.50).
        // InvariantCulture şart — makinenin yerel ayarı virgüllü ondalık (45,50)
        // üretirse CSV'nin alan ayıracı virgülle çakışır, tablo kayar.
        var ci = CultureInfo.InvariantCulture;

        var dataRows = rows.Select(x => (IReadOnlyList<string>)new[]
        {
            x.FullName,
            x.PeriodStart.ToString("yyyy-MM-dd", ci),
            x.PeriodEnd.ToString("yyyy-MM-dd", ci),
            x.NormalHours.ToString("0.00", ci),
            x.OvertimeHours.ToString("0.00", ci),
            x.TotalHours.ToString("0.00", ci),
            // Brüt null ise BOŞ bırak ("0.00" değil): null=ücret tanımsız, 0=bedava çalıştı.
            // Boş hücre yöneticiye "ücret gir" der; 0.00 eksiği gizler.
            x.GrossAmount?.ToString("0.00", ci) ?? "",
            x.LockedAt?.ToString("yyyy-MM-dd HH:mm", ci) ?? ""
        }).ToList();

        var bytes = CsvBuilder.Build(header, dataRows);

        // Dosya adı: filtreye göre anlamlı. Dönem verildiyse onu yansıt.
        var fileName = BuildFileName(request);

        return new CsvFileResult(bytes, fileName);
    }

    // bordro_2026-06-01_2026-06-30.csv  ya da  bordro.csv (filtre yoksa)
    private static string BuildFileName(ExportOvertimeRecordsQuery request)
    {
        var ci = CultureInfo.InvariantCulture;
        if (request.From is { } f && request.To is { } t)
            return $"bordro_{f.ToString("yyyy-MM-dd", ci)}_{t.ToString("yyyy-MM-dd", ci)}.csv";
        if (request.From is { } f2)
            return $"bordro_{f2.ToString("yyyy-MM-dd", ci)}.csv";
        return "bordro.csv";
    }
}