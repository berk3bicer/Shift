using MediatR;

namespace Shift.Application.Features.Overtime.Records.Export;

// Kapanmış (kilitli) mesai kayıtlarını CSV dosyası olarak export eder.
// Filtre imzası ListOvertimeRecordsQuery ile AYNI — opsiyonel userId/from/to.
// Böylece "tek personel" ve "tüm ay" ayrı uç değil; tek uç filtreyle ikisini de verir.
//
// Liste ucundan tek farkı: SADECE kilitli kayıtlar export'a girer. Kilitsiz kayıt
// "henüz dondurulmamış, değişebilir" demek — bordroya gidemez (Gün 11 kilit mantığı).
public record ExportOvertimeRecordsQuery(
    Guid? UserId,
    DateOnly? From,
    DateOnly? To
) : IRequest<CsvFileResult>;

// Handler'ın controller'a verdiği paket: dosya içeriği + indirme adı.
// Controller bunu File(Content, "text/csv", FileName) ile dosyaya çevirir.
public record CsvFileResult(byte[] Content, string FileName);