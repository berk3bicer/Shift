using Shift.API.RateLimiting;

namespace Shift.Tests;

// Rate limit KONFİG'ini sabitler (middleware sayaç testi zaman bağımlı/kırılgan olurdu;
// canlı 429 davranışı curl ile doğrulanır). Değerler bilinçli: auth-strict e-posta
// bombardımanını keser, auth-login brute-force'u yavaşlatır ama normal girişi rahatsız etmez.
public class RateLimitPolicyTests
{
    [Fact]
    public void AuthStrict_5_Istek_15_Dakika_Kuyruksuz()
    {
        var w = AuthRateLimitPolicies.StrictWindow();
        Assert.Equal(5, w.PermitLimit);
        Assert.Equal(TimeSpan.FromMinutes(15), w.Window);
        Assert.Equal(0, w.QueueLimit); // aşan istek beklemez, anında 429
    }

    [Fact]
    public void AuthLogin_10_Istek_5_Dakika_Kuyruksuz()
    {
        var w = AuthRateLimitPolicies.LoginWindow();
        Assert.Equal(10, w.PermitLimit);
        Assert.Equal(TimeSpan.FromMinutes(5), w.Window);
        Assert.Equal(0, w.QueueLimit);
    }

    // Policy adları controller attribute'larında string olarak yaşar — yanlışlıkla
    // yeniden adlandırma limitleri sessizce devre dışı bırakırdı.
    [Fact]
    public void Policy_Adlari_Sabit()
    {
        Assert.Equal("auth-strict", AuthRateLimitPolicies.AuthStrict);
        Assert.Equal("auth-login", AuthRateLimitPolicies.AuthLogin);
    }
}
