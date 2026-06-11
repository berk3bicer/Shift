using Shift.Domain.Common;

namespace Shift.Domain.Entities;

public class RefreshToken : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty; // token'ın kendisi değil, hash'i
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;

    // Yardımcı: geçerli mi?
    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}