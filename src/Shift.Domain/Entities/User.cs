using Shift.Domain.Common;

namespace Shift.Domain.Entities;

public class User : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;

    // Birincil pozisyon — bordro/mesai ücreti bu pozisyonun HourlyRate'inden gelir.
    // Nullable: bir personel (henüz) pozisyonsuz olabilir (davet edilmiş ama atanmamış).
    // Çok-pozisyonlu ücret ileride gerekirse vardiya-bazlı türetmeye geçilir (şimdilik YAGNI).
    public Guid? PositionId { get; set; }
    public Position? Position { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public ICollection<UserBranch> UserBranches { get; set; } = new List<UserBranch>();
}