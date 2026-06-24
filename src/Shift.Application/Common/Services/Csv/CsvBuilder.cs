using System.Text;

namespace Shift.Application.Common.Services.Csv;

// Saf CSV kurucu — hiçbir şey okumaz/yazmaz, sadece satır listesini CSV metnine çevirir.
// ShiftRuleChecker / OvertimeCalculator ile aynı felsefe: girdi → çıktı, yan etki yok.
//
// İki sorumluluk:
//   1) RFC 4180 kaçışı: bir alanda virgül, çift tırnak veya satır sonu varsa alanı
//      çift tırnağa al, içindeki çift tırnakları ikiye katla. Yoksa bordro satırı kayar
//      (ör. "Bıçer, Berke" adı iki alana bölünür).
//   2) UTF-8 BOM: Excel BOM'suz UTF-8 CSV'de Türkçe karakterleri (ş, ğ, ı) bozabilir.
//      Başa BOM koyunca Excel doğru okur; Logo/Mikro de sorun etmez.
public static class CsvBuilder
{
    // Excel'in UTF-8'i doğru tanıması için başa eklenen byte-order mark.
    private static readonly byte[] Utf8Bom = { 0xEF, 0xBB, 0xBF };

    // Başlık + satırları CSV byte dizisine çevirir (BOM dahil).
    // header: kolon adları. rows: her biri header ile aynı uzunlukta alan dizisi.
    public static byte[] Build(IReadOnlyList<string> header, IEnumerable<IReadOnlyList<string>> rows)
    {
        var sb = new StringBuilder();

        sb.Append(BuildLine(header));
        foreach (var row in rows)
            sb.Append(BuildLine(row));

        // String'i UTF-8 byte'a çevir, başına BOM ekle.
        var body = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[Utf8Bom.Length + body.Length];
        Buffer.BlockCopy(Utf8Bom, 0, result, 0, Utf8Bom.Length);
        Buffer.BlockCopy(body, 0, result, Utf8Bom.Length, body.Length);
        return result;
    }

    // Tek satır: alanları kaçışla, virgülle birleştir, satır sonu ekle.
    // RFC 4180 satır sonu \r\n — Excel ve muhasebe yazılımları en güvenli bunu okur.
    private static string BuildLine(IReadOnlyList<string> fields)
        => string.Join(",", fields.Select(Escape)) + "\r\n";

    // RFC 4180 alan kaçışı.
    private static string Escape(string field)
    {
        field ??= string.Empty;

        // Virgül, çift tırnak veya satır sonu içeriyorsa sarmalanmalı.
        bool mustQuote = field.Contains(',')
            || field.Contains('"')
            || field.Contains('\n')
            || field.Contains('\r');

        if (!mustQuote)
            return field;

        // İçteki çift tırnakları ikiye katla, sonra tümünü çift tırnağa al.
        return "\"" + field.Replace("\"", "\"\"") + "\"";
    }
}