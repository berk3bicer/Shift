namespace Shift.Application.Common;

// FE'nin kök adresi (davet/şifre-sıfırlama linkleri bunun altına kurulur).
// Options paketi yerine düz singleton: API katmanı config'den okuyup DI'a koyar.
public record AppUrlOptions(string BaseUrl)
{
    public string InviteLink(string rawToken) => $"{BaseUrl.TrimEnd('/')}/davet/{rawToken}";
    public string PasswordResetLink(string rawToken) => $"{BaseUrl.TrimEnd('/')}/sifre-sifirla/{rawToken}";
}
