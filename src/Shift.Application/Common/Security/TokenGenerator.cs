using System.Security.Cryptography;

namespace Shift.Application.Common.Security;

// Davet / şifre-sıfırlama için ham token üretimi. Kriptografik random, 32 bayt.
// Hex çıktı: URL'de güvenli (base64'ün +/= sorunu yok) — link {APP_URL}/davet/{token}.
public static class TokenGenerator
{
    public static string Generate() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
}
