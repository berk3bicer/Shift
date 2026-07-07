using System.Threading.RateLimiting;

namespace Shift.API.RateLimiting;

// Anonim auth uçlarının IP bazlı limitleri. Neden IP bazlı, e-posta bazlı değil:
// e-posta bazlı limit "bu e-posta kayıtlı mı?" sorusuna cevap sızdırır (enumeration).
// Limit aşılana KADAR cevaplar aynı kalır; aşınca herkes için 429.
// Konfig testte assert edilir (RateLimitPolicyTests) — middleware sayaç testi kırılgan olurdu.
public static class AuthRateLimitPolicies
{
    // register / forgot-password / accept-invite / reset-password / resend-invite:
    // e-posta tetikler, token tüketir ya da hesap yaratır → dar pencere (bombardıman önleme).
    public const string AuthStrict = "auth-strict";

    // login: brute-force yavaşlatma; normal kullanıcıyı rahatsız etmeyecek kadar cömert.
    public const string AuthLogin = "auth-login";

    public static FixedWindowRateLimiterOptions StrictWindow() => new()
    {
        PermitLimit = 5,
        Window = TimeSpan.FromMinutes(15),
        QueueLimit = 0, // bekletme yok — aşan istek anında 429
    };

    public static FixedWindowRateLimiterOptions LoginWindow() => new()
    {
        PermitLimit = 10,
        Window = TimeSpan.FromMinutes(5),
        QueueLimit = 0,
    };
}
