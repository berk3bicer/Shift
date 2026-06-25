namespace Shift.Application.Common.Interfaces;

// Dosya/blob depolama soyutlaması. Uygulama katmanı SAĞLAYICIYI bilmez (R2, S3, yerel
// mock) — sadece "yükleme hedefi ver", "indirme linki ver" der. ITenantProvider /
// IShiftDbContext ile aynı port-adapter kalıbı: somut implementasyon Infrastructure'da.
//
// Akış (presigned): backend byte PROXY'lemez. Client yükleme URL'i ister → doğrudan
// storage'a PUT'lar → backend object key'i kaydeder. Görüntülemede indirme URL'i üretilir.
public interface IFileStorage
{
    // Verilen key için presigned yükleme hedefi (URL + HTTP metodu, genelde PUT).
    // Client bu URL'e dosyayı doğrudan yükler.
    Task<FileUploadTarget> CreateUploadUrlAsync(string key, string contentType, CancellationToken ct);

    // Verilen key için presigned indirme/görüntüleme URL'i (süreli).
    Task<string> CreateDownloadUrlAsync(string key, CancellationToken ct);
}

// Presigned yükleme hedefi: client'ın gideceği URL + kullanacağı HTTP metodu.
public record FileUploadTarget(string Url, string Method);
