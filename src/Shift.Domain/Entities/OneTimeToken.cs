using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Tek-kullanımlık, süreli token'ın amacı: davet kabulü mü, şifre sıfırlama mı?
public enum TokenPurpose
{
    Invite = 1,
    PasswordReset = 2,
}

// Davet + şifre-sıfırlama token'ı — RefreshToken deseninin kopyası:
// ham token DB'ye YAZILMAZ, sadece SHA-256 hash'i saklanır (DB sızsa bile
// linkteki ham token üretilemez). Tek entity + Purpose enum'u: iki akışın
// güvenlik anatomisi aynı (hash + expiry + tek kullanım), ayrı tablo kopya olurdu.
public class OneTimeToken : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty; // token'ın kendisi değil, hash'i
    public TokenPurpose Purpose { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;

    // Yardımcı: hâlâ tüketilebilir mi?
    public bool IsActive => !IsUsed && ExpiresAt > DateTime.UtcNow;
}
