using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Shift.Application.Common.Interfaces;

namespace Shift.Infrastructure.Storage;

// IFileStorage'ın YEREL MOCK implementasyonu (dev/demo; R2 credential gelince swap).
// Presigned kalıbını yerelde taklit eder: yükleme/indirme URL'leri backend'in KENDİ
// /api/files/local ucuna işaret eder, HMAC imza + süre taşır. Byte'lar yerel klasöre yazılır.
// Gerçek R2'de bu URL'ler doğrudan R2'ye gider; akış (URL al → PUT → key kaydet) aynı kalır.
public class LocalFileStorage : IFileStorage
{
    private readonly FileStorageOptions _opt;

    public LocalFileStorage(IOptions<FileStorageOptions> options)
    {
        _opt = options.Value;
    }

    public Task<FileUploadTarget> CreateUploadUrlAsync(string key, string contentType, CancellationToken ct)
        => Task.FromResult(new FileUploadTarget(BuildSignedUrl(key), "PUT"));

    public Task<string> CreateDownloadUrlAsync(string key, CancellationToken ct)
        => Task.FromResult(BuildSignedUrl(key));

    // ── Mock ucunun (FilesController) kullandığı yardımcılar ──

    public bool ValidateSignature(string key, long exp, string sig)
    {
        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > exp)
            return false;   // süresi geçmiş
        var expected = ComputeSignature(key, exp);
        // Sabit-zamanlı karşılaştırma (timing attack'a kapalı).
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(sig));
    }

    public async Task SaveAsync(string key, Stream content, CancellationToken ct)
    {
        var path = ResolvePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var fs = File.Create(path);
        await content.CopyToAsync(fs, ct);
    }

    public bool TryOpenRead(string key, out Stream stream, out string contentType)
    {
        var path = ResolvePath(key);
        contentType = GuessContentType(key);
        if (!File.Exists(path)) { stream = Stream.Null; return false; }
        stream = File.OpenRead(path);
        return true;
    }

    // ── İç yardımcılar ──

    private string BuildSignedUrl(string key)
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(_opt.UrlExpiryMinutes).ToUnixTimeSeconds();
        var sig = ComputeSignature(key, exp);
        var baseUrl = _opt.PublicBaseUrl.TrimEnd('/');
        return $"{baseUrl}/api/files/local?key={Uri.EscapeDataString(key)}&exp={exp}&sig={Uri.EscapeDataString(sig)}";
    }

    private string ComputeSignature(string key, long exp)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_opt.SigningSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes($"{key}|{exp}"));
        return Convert.ToBase64String(hash);
    }

    // key'i base klasöre güvenli çöz (path traversal'a kapalı).
    private string ResolvePath(string key)
    {
        var baseFull = Path.GetFullPath(_opt.LocalBasePath);
        var full = Path.GetFullPath(Path.Combine(baseFull, key));
        if (!full.StartsWith(baseFull + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            && full != baseFull)
            throw new InvalidOperationException("Geçersiz dosya yolu.");
        return full;
    }

    private static string GuessContentType(string key) =>
        Path.GetExtension(key).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };
}
