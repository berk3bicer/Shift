namespace Shift.Infrastructure.Storage;

// Dosya depolama ayarları (appsettings "FileStorage" bölümü). Varsayılanlar dev'de
// kutudan çıktığı gibi çalışır; R2 gelince Provider + R2* alanları doldurulur.
public class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    // "Local" (mock) veya "R2" (credential gelince). Şimdilik Local.
    public string Provider { get; set; } = "Local";

    // ── Yerel mock ayarları ──
    // Dosyaların yazılacağı yerel klasör (presigned PUT bu klasöre yazar).
    public string LocalBasePath { get; set; } = "App_Data/uploads";

    // Presigned URL'lerin işaret edeceği API kök adresi.
    public string PublicBaseUrl { get; set; } = "http://localhost:5203";

    // Presigned URL imzalama sırrı (mock; R2'de gerçek SDK imzalar). Dev varsayılanı.
    public string SigningSecret { get; set; } = "dev-local-storage-signing-secret-change-me";

    // URL geçerlilik süresi (dakika).
    public int UrlExpiryMinutes { get; set; } = 15;
}
