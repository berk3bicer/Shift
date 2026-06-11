using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Common;
using Shift.Domain.Entities;

namespace Shift.Infrastructure.Persistence;

public class ShiftDbContext : DbContext, IShiftDbContext
{
    private readonly ITenantProvider _tenantProvider;

    public ShiftDbContext(
        DbContextOptions<ShiftDbContext> options,
        ITenantProvider tenantProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Position> Positions => Set<Position>();
    public DbSet<Shift.Domain.Entities.Shift> Shifts => Set<Shift.Domain.Entities.Shift>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserBranch> UserBranches => Set<UserBranch>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Branch (Şube) ──
        // Tenant -> Branches ilişkisi: bir şube bir işletmeye aittir
        modelBuilder.Entity<Branch>()
            .HasOne(b => b.Tenant)
            .WithMany(t => t.Branches)
            .HasForeignKey(b => b.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Aynı işletmede iki şube aynı ada sahip olamaz
        modelBuilder.Entity<Branch>()
            .HasIndex(b => new { b.TenantId, b.Name })
            .IsUnique();

        // Branch tenant'a ait -> global tenant filtresi (izolasyon)
        modelBuilder.Entity<Branch>().HasQueryFilter(
            b => b.TenantId == _tenantProvider.GetTenantId());

        // ── Position (Pozisyon) ──
        // Aynı işletmede iki pozisyon aynı ada sahip olamaz
        modelBuilder.Entity<Position>()
            .HasIndex(p => new { p.TenantId, p.Name })
            .IsUnique();

        // Para alanı: decimal precision/scale belirt (numeric(10,2))
        // 10 basamak toplam, 2'si ondalık → 99.999.999,99'a kadar saat ücreti
        modelBuilder.Entity<Position>()
            .Property(p => p.HourlyRate)
            .HasPrecision(10, 2);

        // Position tenant'a ait -> global filtre
        modelBuilder.Entity<Position>().HasQueryFilter(
            p => p.TenantId == _tenantProvider.GetTenantId());

        // ── Shift (Vardiya) ──
        // Branch -> Shifts: vardiya bir şubeye ait. Şube silinmesi vardiyayı silmesin.
        modelBuilder.Entity<Shift.Domain.Entities.Shift>()
            .HasOne(s => s.Branch)
            .WithMany()
            .HasForeignKey(s => s.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // User -> Shifts: atanan personel. Personel silinirse vardiya
        // "açık vardiya"ya döner (UserId null olur), kayıt korunur.
        modelBuilder.Entity<Shift.Domain.Entities.Shift>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Position -> Shifts: pozisyon silinmesi vardiyayı silmesin.
        modelBuilder.Entity<Shift.Domain.Entities.Shift>()
            .HasOne(s => s.Position)
            .WithMany()
            .HasForeignKey(s => s.PositionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Takvim sorgularını hızlandır: şube + zaman aralığı sık sorgulanacak
        modelBuilder.Entity<Shift.Domain.Entities.Shift>()
            .HasIndex(s => new { s.BranchId, s.StartTime });

        // Shift tenant'a ait -> global filtre
        modelBuilder.Entity<Shift.Domain.Entities.Shift>().HasQueryFilter(
            s => s.TenantId == _tenantProvider.GetTenantId());

        // User: TenantId üzerinden global filtre.
        // Her User sorgusuna otomatik "WHERE TenantId = currentTenant" eklenir.
        modelBuilder.Entity<User>().HasQueryFilter(
            u => u.TenantId == _tenantProvider.GetTenantId());

        // User.Email her tenant içinde benzersiz olsun
        modelBuilder.Entity<User>()
            .HasIndex(u => new { u.TenantId, u.Email })
            .IsUnique();

        // Tenant -> Users ilişkisi
        modelBuilder.Entity<User>()
            .HasOne(u => u.Tenant)
            .WithMany(t => t.Users)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        // UserRole: çoğa-çok köprüsü
        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Aynı kullanıcıya aynı rol iki kez atanmasın
        modelBuilder.Entity<UserRole>()
            .HasIndex(ur => new { ur.UserId, ur.RoleId })
            .IsUnique();

        // UserRole tenant'a ait -> global filtre
        modelBuilder.Entity<UserRole>().HasQueryFilter(
            ur => ur.TenantId == _tenantProvider.GetTenantId());
        // ── UserBranch (Kullanıcı-Şube köprüsü) ──
        modelBuilder.Entity<UserBranch>()
            .HasOne(ub => ub.User)
            .WithMany(u => u.UserBranches)
            .HasForeignKey(ub => ub.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserBranch>()
            .HasOne(ub => ub.Branch)
            .WithMany(b => b.UserBranches)
            .HasForeignKey(ub => ub.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // Aynı kullanıcı aynı şubeye iki kez atanmasın
        modelBuilder.Entity<UserBranch>()
            .HasIndex(ub => new { ub.UserId, ub.BranchId })
            .IsUnique();

        // UserBranch tenant'a ait -> global filtre
        modelBuilder.Entity<UserBranch>().HasQueryFilter(
            ub => ub.TenantId == _tenantProvider.GetTenantId());

        // Roller her tenant için ortak referans verisi (seed)
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Type = RoleType.Owner, Name = "Sahip", CreatedAt = seedDate },
            new Role { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Type = RoleType.Manager, Name = "Yönetici", CreatedAt = seedDate },
            new Role { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Type = RoleType.AssistantManager, Name = "Asistan Yönetici", CreatedAt = seedDate },
            new Role { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Type = RoleType.Staff, Name = "Personel", CreatedAt = seedDate },
            new Role { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Type = RoleType.Supplier, Name = "Tedarikçi", CreatedAt = seedDate }
        );

        // RefreshToken ilişkisi + tenant filtresi
        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>().HasQueryFilter(
            rt => rt.TenantId == _tenantProvider.GetTenantId());
    }

    // SaveChanges damgalama: yeni eklenen ITenantEntity kayıtlarına
    // otomatik TenantId yaz. Geliştirici elle set etmeyi unutsa bile doğru tenant'a gider.
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantProvider.GetTenantId();

        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added && tenantId.HasValue)
            {
                entry.Entity.TenantId = tenantId.Value;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}