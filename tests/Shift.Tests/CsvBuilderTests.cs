using System.Text;
using Shift.Application.Common.Services.Csv;

namespace Shift.Tests;

// CsvBuilder saf bir biçimlendirici — DB yok, kurulum yok. Sadece girdi→çıktı.
// Bu yüzden testler de sade: string ver, byte'ları string'e çevir, doğrula.
public class CsvBuilderTests
{
    // BOM'u atlayıp gövdeyi okunabilir string'e çeviren yardımcı.
    // CsvBuilder başa 3 byte UTF-8 BOM ekliyor (Excel için). Testte içeriği
    // kıyaslarken o 3 byte'ı atlıyoruz, geri kalanı UTF-8 string'e çeviriyoruz.
    private static string BodyWithoutBom(byte[] bytes)
    {
        // BOM = EF BB BF (3 byte). Varsa atla.
        int offset = (bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF)
            ? 3 : 0;
        return Encoding.UTF8.GetString(bytes, offset, bytes.Length - offset);
    }

    // ── 1) Çıktı UTF-8 BOM ile başlamalı (Excel Türkçe karakterleri bozmasın) ──
    [Fact]
    public void Cikti_UTF8_BOM_Ile_Baslar()
    {
        var bytes = CsvBuilder.Build(
            new[] { "A", "B" },
            new[] { (IReadOnlyList<string>)new[] { "1", "2" } });

        Assert.True(bytes.Length >= 3);
        Assert.Equal(0xEF, bytes[0]);
        Assert.Equal(0xBB, bytes[1]);
        Assert.Equal(0xBF, bytes[2]);
    }

    // ── 2) Basit satır: kaçış gerekmiyorsa alanlar düz, virgülle, \r\n ile ──
    [Fact]
    public void Basit_Satir_Duz_Yazilir()
    {
        var bytes = CsvBuilder.Build(
            new[] { "Personel", "Saat" },
            new[] { (IReadOnlyList<string>)new[] { "Berke", "8" } });

        var text = BodyWithoutBom(bytes);
        Assert.Equal("Personel,Saat\r\nBerke,8\r\n", text);
    }

    // ── 3) KRİTİK: alanda virgül varsa, alan çift tırnağa alınmalı ──
    // "Biçer, Berke" gibi bir ad ham yazılırsa satır iki alana bölünür, bordro kayar.
    [Fact]
    public void Virgullu_Alan_Tirnaga_Alinir()
    {
        var bytes = CsvBuilder.Build(
            new[] { "Ad" },
            new[] { (IReadOnlyList<string>)new[] { "Biçer, Berke" } });

        var text = BodyWithoutBom(bytes);
        // Beklenen: alan tümüyle çift tırnak içinde.
        Assert.Equal("Ad\r\n\"Biçer, Berke\"\r\n", text);
    }

    // ── 4) Alanda çift tırnak varsa, ikiye katlanır + alan sarmalanır ──
    // RFC 4180: içteki " → "" olur, sonra tüm alan "..." içine alınır.
    [Fact]
    public void Cift_Tirnakli_Alan_Ikiye_Katlanir()
    {
        var bytes = CsvBuilder.Build(
            new[] { "Not" },
            new[] { (IReadOnlyList<string>)new[] { "12\" pizza" } });

        var text = BodyWithoutBom(bytes);
        // 12" pizza → "12"" pizza"
        Assert.Equal("Not\r\n\"12\"\" pizza\"\r\n", text);
    }

    // ── 5) Alanda satır sonu varsa da sarmalanır (tablo bozulmasın) ──
    [Fact]
    public void Satir_Sonlu_Alan_Tirnaga_Alinir()
    {
        var bytes = CsvBuilder.Build(
            new[] { "Aciklama" },
            new[] { (IReadOnlyList<string>)new[] { "satir1\nsatir2" } });

        var text = BodyWithoutBom(bytes);
        Assert.Equal("Aciklama\r\n\"satir1\nsatir2\"\r\n", text);
    }

    // ── 6) Hiç satır yoksa sadece başlık yazılır (boş bordro patlamaz) ──
    [Fact]
    public void Bos_Satir_Listesi_Sadece_Baslik_Yazar()
    {
        var bytes = CsvBuilder.Build(
            new[] { "Personel", "Saat" },
            Array.Empty<IReadOnlyList<string>>());

        var text = BodyWithoutBom(bytes);
        Assert.Equal("Personel,Saat\r\n", text);
    }
}