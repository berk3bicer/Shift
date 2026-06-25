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
    public DbSet<Availability> Availabilities => Set<Availability>();
    public DbSet<TimeOffRequest> TimeOffRequests => Set<TimeOffRequest>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<OvertimeSettings> OvertimeSettings => Set<OvertimeSettings>();
    public DbSet<OvertimeRecord> OvertimeRecords => Set<OvertimeRecord>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Checklist> Checklists => Set<Checklist>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<ChecklistRun> ChecklistRuns => Set<ChecklistRun>();
    public DbSet<ShiftNote> ShiftNotes => Set<ShiftNote>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<TimeClock> TimeClocks => Set<TimeClock>();
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

        // User -> Position (birincil pozisyon): bordro ücreti buradan gelir.
        // Pozisyon silinirse personel pozisyonsuz kalsın (SetNull), personel SİLİNMESİN.
        // FK nullable olduğu için SetNull doğru davranış.
        modelBuilder.Entity<User>()
            .HasOne(u => u.Position)
            .WithMany()
            .HasForeignKey(u => u.PositionId)
            .OnDelete(DeleteBehavior.SetNull);

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

        // ── Availability (Müsaitlik) ──
        // User -> Availabilities: bir personelin birden çok müsaitlik kaydı olabilir.
        // Personel silinirse müsaitlik kayıtları da gitsin (Cascade).
        modelBuilder.Entity<Availability>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Sorgu hızı: bir personelin belirli gündeki müsaitliğini ararken kullanılır.
        modelBuilder.Entity<Availability>()
            .HasIndex(a => new { a.UserId, a.DayOfWeek });

        // Availability tenant'a ait -> global filtre (tenant izolasyonu)
        modelBuilder.Entity<Availability>().HasQueryFilter(
            a => a.TenantId == _tenantProvider.GetTenantId());

        // ── TimeOffRequest (İzin) ──
        // İKİ ayrı User ilişkisi var, ikisi de Users tablosuna bakar:
        //   1) User          = talebi oluşturan personel
        //   2) DecidedByUser = kararı veren yönetici (nullable, karar öncesi boş)
        // EF'e ikisini AÇIKÇA ayırmamız şart, yoksa tek ilişki sanıp karıştırır.
        // İkisi de Restrict: kullanıcı silinince izin geçmişi (audit) uçmasın.
        modelBuilder.Entity<TimeOffRequest>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TimeOffRequest>()
            .HasOne(t => t.DecidedByUser)
            .WithMany()
            .HasForeignKey(t => t.DecidedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Sorgu hızı: "bu personelin izinleri" ve "bekleyen talepler" sık sorgulanır.
        modelBuilder.Entity<TimeOffRequest>()
            .HasIndex(t => new { t.UserId, t.Status });

        // TimeOffRequest tenant'a ait -> global filtre (tenant izolasyonu)
        modelBuilder.Entity<TimeOffRequest>().HasQueryFilter(
            t => t.TenantId == _tenantProvider.GetTenantId());

        // Notification tenant'a ait -> global filtre
        modelBuilder.Entity<Notification>().HasQueryFilter(
            n => n.TenantId == _tenantProvider.GetTenantId());

        // ── OvertimeSettings (Mesai Ayarları) ──
        // Tenant başına TEK kayıt olmalı → TenantId üzerinde unique index.
        // Bu, "bir işletmenin bir çarpan seti vardır" kuralını DB seviyesinde garantiler.
        modelBuilder.Entity<OvertimeSettings>()
            .HasIndex(o => o.TenantId)
            .IsUnique();

        // ── OvertimeRecord (Donmuş Mesai Kaydı / Bordro) ──
        // User -> OvertimeRecords: bir personelin çok dönem kaydı olur.
        // Restrict: personel silinse bile bordro geçmişi (audit) korunmalı.
        modelBuilder.Entity<OvertimeRecord>()
            .HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Kapanışı yapan yönetici (audit). İKİNCİ User FK'si — TimeOffRequest'teki
        // DecidedByUser deseninin aynısı. EF'e açıkça ayrı ilişki olduğunu söylüyoruz.
        // Nullable (henüz kilitlenmemiş kayıtta boş). Restrict: yönetici silinse geçmiş durur.
        modelBuilder.Entity<OvertimeRecord>()
            .HasOne(o => o.LockedByUser)
            .WithMany()
            .HasForeignKey(o => o.LockedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Kilidi açan yönetici (audit). ÜÇÜNCÜ User FK'si. Aynı desen, Restrict.
        modelBuilder.Entity<OvertimeRecord>()
            .HasOne(o => o.UnlockedByUser)
            .WithMany()
            .HasForeignKey(o => o.UnlockedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Aynı personele aynı dönem İKİ kez kapatılamaz → (UserId, PeriodStart, PeriodEnd)
        // unique. Bu, "Haziran'ı yanlışlıkla iki kez dondurma" hatasını DB'de engeller.
        modelBuilder.Entity<OvertimeRecord>()
            .HasIndex(o => new { o.UserId, o.PeriodStart, o.PeriodEnd })
            .IsUnique();

        // Saat ve para alanları decimal precision. Saatler numeric(7,2) (haftalarca
        // toplam saat 999,99'u aşmaz ama bordro güvenli olsun diye 7 basamak).
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.TotalHours).HasPrecision(7, 2);
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.NormalHours).HasPrecision(7, 2);
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.OvertimeHours).HasPrecision(7, 2);
        // Ücret alanları para hassasiyeti: numeric(10,2) (Position.HourlyRate ile aynı).
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.AppliedHourlyRate).HasPrecision(10, 2);
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.OvertimeMultiplier).HasPrecision(5, 2);
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.NightPremium).HasPrecision(12, 2);
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.WeekendPremium).HasPrecision(12, 2);
        modelBuilder.Entity<OvertimeRecord>().Property(o => o.GrossAmount).HasPrecision(12, 2);

        // ── Haftalık kırılım → jsonb kolonu (OwnsMany + ToJson) ──
        // Weeks listesi ayrı tabloya AÇILMAZ; tek bir jsonb kolonunda gömülü durur.
        // Owned type: kendi kimliği yok, OvertimeRecord ile yaşar/ölür. Sorgulanmayan,
        // hep birlikte okunan, değişmeyen snapshot için ideal (ayrı tablo + join yükü yok).
        modelBuilder.Entity<OvertimeRecord>()
            .OwnsMany(o => o.Weeks, b =>
            {
                b.ToJson();
                // jsonb içindeki decimal'ler de precision alır (PostgreSQL number serialize).
                b.Property(w => w.TotalHours).HasPrecision(7, 2);
                b.Property(w => w.NormalHours).HasPrecision(7, 2);
                b.Property(w => w.OvertimeHours).HasPrecision(7, 2);
            });

        // OvertimeRecord tenant'a ait -> global filtre (tenant izolasyonu)
        modelBuilder.Entity<OvertimeRecord>().HasQueryFilter(
            o => o.TenantId == _tenantProvider.GetTenantId());

        // Tüm çarpan/oran alanları para hassasiyetinde decimal.
        // numeric(5,2) → 999,99'a kadar çarpan (1.5, 2.0 gibi) fazlasıyla yeter.
        modelBuilder.Entity<OvertimeSettings>()
            .Property(o => o.WeeklyOvertimeThresholdHours).HasPrecision(5, 2);
        modelBuilder.Entity<OvertimeSettings>()
            .Property(o => o.OvertimeMultiplier).HasPrecision(5, 2);
        modelBuilder.Entity<OvertimeSettings>()
            .Property(o => o.NightMultiplier).HasPrecision(5, 2);
        modelBuilder.Entity<OvertimeSettings>()
            .Property(o => o.WeekendMultiplier).HasPrecision(5, 2);
        modelBuilder.Entity<OvertimeSettings>()
            .Property(o => o.HolidayMultiplier).HasPrecision(5, 2);

        // OvertimeSettings tenant'a ait -> global filtre (tenant izolasyonu)
        modelBuilder.Entity<OvertimeSettings>().HasQueryFilter(
            o => o.TenantId == _tenantProvider.GetTenantId());

        // Sorgu hızı: "kullanıcının okunmamış bildirimleri" sık sorgulanır.
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead });

        // RelatedEntityId'ye FK YOK — bilinçli. Bildirim, işaret ettiği kayıt
        // (vardiya vb.) silinse bile durabilmeli (geçmiş bildirim anlamlı kalır).

        // Notification tenant'a ait -> global filtre
        modelBuilder.Entity<Notification>().HasQueryFilter(
            n => n.TenantId == _tenantProvider.GetTenantId());

        // ── TimeClock (Giriş-Çıkış / Puantaj) ──
        // User -> TimeClocks: bir personelin çok puantaj kaydı olur.
        // Restrict: personel silinse bile puantaj geçmişi (audit/bordro) korunur.
        modelBuilder.Entity<TimeClock>()
            .HasOne(tc => tc.User)
            .WithMany()
            .HasForeignKey(tc => tc.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Branch -> TimeClocks: puantaj bir şubede gerçekleşir.
        // Restrict: şube silinse bile geçmiş puantaj korunur.
        modelBuilder.Entity<TimeClock>()
            .HasOne(tc => tc.Branch)
            .WithMany()
            .HasForeignKey(tc => tc.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Sorgu hızı: "bu personelin AÇIK kaydı var mı?" (CheckOutTime == null)
        // her ClockIn/ClockOut'ta sorgulanır → en kritik index.
        modelBuilder.Entity<TimeClock>()
            .HasIndex(tc => new { tc.UserId, tc.CheckOutTime });

        // TimeClock tenant'a ait -> global filtre (izolasyon)
        modelBuilder.Entity<TimeClock>().HasQueryFilter(
            tc => tc.TenantId == _tenantProvider.GetTenantId());

        // ── TaskItem (Kanban Görev) ──
        // Branch -> Tasks: görev bir şubeye ait. Şube silinse görev geçmişi uçmasın.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Branch)
            .WithMany()
            .HasForeignKey(t => t.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Atanan personel: silinirse görev "havuza" döner (SetNull), görev korunur.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedUser)
            .WithMany()
            .HasForeignKey(t => t.AssignedUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Atanan pozisyon: silinirse atama kopar (SetNull), görev korunur.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedPosition)
            .WithMany()
            .HasForeignKey(t => t.AssignedPositionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Oluşturan/atayan yönetici (audit). İKİNCİ User FK'si — TimeOffRequest deseni.
        // EF'e açıkça ayrı ilişki olduğunu söylüyoruz. SetNull: yönetici silinse görev durur.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Tamamlayan personel (audit). ÜÇÜNCÜ User FK'si. Aynı desen, SetNull.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.CompletedByUser)
            .WithMany()
            .HasForeignKey(t => t.CompletedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Metin alanları için makul üst sınır (DB'de nvarchar/text boyutu).
        modelBuilder.Entity<TaskItem>().Property(t => t.Title).HasMaxLength(200);
        modelBuilder.Entity<TaskItem>().Property(t => t.Description).HasMaxLength(2000);

        // Sorgu hızı: pano "şube + durum" ile sorgulanır (Yapılacak sütununu çek vb.).
        modelBuilder.Entity<TaskItem>()
            .HasIndex(t => new { t.BranchId, t.Status });

        // TaskItem tenant'a ait -> global filtre (tenant izolasyonu)
        modelBuilder.Entity<TaskItem>().HasQueryFilter(
            t => t.TenantId == _tenantProvider.GetTenantId());

        // ── Checklist (Kontrol Listesi ŞABLONU) ──
        // Şablon maddeleri şablonla yaşar/ölür → Cascade.
        modelBuilder.Entity<Checklist>()
            .HasMany(c => c.Items)
            .WithOne(i => i.Checklist)
            .HasForeignKey(i => i.ChecklistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Checklist>().Property(c => c.Name).HasMaxLength(200);
        modelBuilder.Entity<ChecklistItem>().Property(i => i.Text).HasMaxLength(500);

        // Checklist + child ChecklistItem tenant filtresi. Child'a da matching filter:
        // EF "filtreli parent ile zorunlu ilişki" uyarısını engeller + izolasyon.
        modelBuilder.Entity<Checklist>().HasQueryFilter(
            c => c.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<ChecklistItem>().HasQueryFilter(
            i => i.TenantId == _tenantProvider.GetTenantId());

        // ── ChecklistRun (doldurulmuş ÇALIŞTIRMA) ──
        // Şube: çalıştırma bir şubede olur. Şube silinse geçmiş çalıştırma korunur → Restrict.
        modelBuilder.Entity<ChecklistRun>()
            .HasOne(r => r.Branch)
            .WithMany()
            .HasForeignKey(r => r.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Şablon: çalıştırma hangi şablondan türedi. Şablon silinmesin → Restrict.
        modelBuilder.Entity<ChecklistRun>()
            .HasOne(r => r.Checklist)
            .WithMany()
            .HasForeignKey(r => r.ChecklistId)
            .OnDelete(DeleteBehavior.Restrict);

        // Başlatan/tamamlayan personel (audit). İki ayrı User FK'si — TimeOffRequest deseni.
        modelBuilder.Entity<ChecklistRun>()
            .HasOne(r => r.StartedByUser)
            .WithMany()
            .HasForeignKey(r => r.StartedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ChecklistRun>()
            .HasOne(r => r.CompletedByUser)
            .WithMany()
            .HasForeignKey(r => r.CompletedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Çalıştırma maddeleri çalıştırmayla yaşar/ölür → Cascade.
        modelBuilder.Entity<ChecklistRun>()
            .HasMany(r => r.Items)
            .WithOne(i => i.ChecklistRun)
            .HasForeignKey(i => i.ChecklistRunId)
            .OnDelete(DeleteBehavior.Cascade);

        // İşaretleyen personel (audit). Silinse işaret durur → SetNull.
        modelBuilder.Entity<ChecklistRunItem>()
            .HasOne(i => i.CheckedByUser)
            .WithMany()
            .HasForeignKey(i => i.CheckedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ChecklistRun>().Property(r => r.ChecklistName).HasMaxLength(200);
        modelBuilder.Entity<ChecklistRunItem>().Property(i => i.Text).HasMaxLength(500);
        modelBuilder.Entity<ChecklistRunItem>().Property(i => i.Note).HasMaxLength(500);

        // Aynı şube + şablon + gün için TEK çalıştırma (bir günde iki açılış olmaz) →
        // unique index. "Bugünün açılışını iki kez başlatma" hatasını DB'de engeller.
        modelBuilder.Entity<ChecklistRun>()
            .HasIndex(r => new { r.BranchId, r.ChecklistId, r.RunDate })
            .IsUnique();

        // ChecklistRun + child ChecklistRunItem tenant filtresi (matching, EF uyarısı için).
        modelBuilder.Entity<ChecklistRun>().HasQueryFilter(
            r => r.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<ChecklistRunItem>().HasQueryFilter(
            i => i.TenantId == _tenantProvider.GetTenantId());

        // ── ShiftNote (Vardiya Notu / handoff akışı) ──
        // Şube: not bir şubeye ait. Şube silinse not geçmişi korunur → Restrict.
        modelBuilder.Entity<ShiftNote>()
            .HasOne(n => n.Branch)
            .WithMany()
            .HasForeignKey(n => n.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Notu bırakan personel (audit). Silinse not durur → SetNull.
        modelBuilder.Entity<ShiftNote>()
            .HasOne(n => n.CreatedByUser)
            .WithMany()
            .HasForeignKey(n => n.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ShiftNote>().Property(n => n.Content).HasMaxLength(2000);

        // Feed sorgusu: "bu şubenin bu gün(ler)deki notları" — şube + tarih sık sorgulanır.
        modelBuilder.Entity<ShiftNote>()
            .HasIndex(n => new { n.BranchId, n.NoteDate });

        // ShiftNote tenant'a ait -> global filtre (tenant izolasyonu).
        modelBuilder.Entity<ShiftNote>().HasQueryFilter(
            n => n.TenantId == _tenantProvider.GetTenantId());

        // ── Announcement (Duyuru) ──
        // Hedef şube (nullable). Şube silinse duyuru kalsın → SetNull.
        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.Branch)
            .WithMany()
            .HasForeignKey(a => a.BranchId)
            .OnDelete(DeleteBehavior.SetNull);

        // Duyuruyu yapan yönetici (audit). Silinse duyuru durur → SetNull.
        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.CreatedByUser)
            .WithMany()
            .HasForeignKey(a => a.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Announcement>().Property(a => a.Title).HasMaxLength(200);
        modelBuilder.Entity<Announcement>().Property(a => a.Body).HasMaxLength(4000);

        // Announcement tenant'a ait -> global filtre (tenant izolasyonu).
        modelBuilder.Entity<Announcement>().HasQueryFilter(
            a => a.TenantId == _tenantProvider.GetTenantId());

        // ── Attachment (Dosya/Fotoğraf iliştirme) ──
        // Yükleyen personel (audit). Silinse kayıt durur → SetNull.
        modelBuilder.Entity<Attachment>()
            .HasOne(a => a.UploadedByUser)
            .WithMany()
            .HasForeignKey(a => a.UploadedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Attachment>().Property(a => a.StorageKey).HasMaxLength(500);
        modelBuilder.Entity<Attachment>().Property(a => a.ContentType).HasMaxLength(100);
        modelBuilder.Entity<Attachment>().Property(a => a.FileName).HasMaxLength(255);

        // Sorgu: "şu varlığın iliştirmeleri" (OwnerType + OwnerId) sık sorgulanır.
        modelBuilder.Entity<Attachment>()
            .HasIndex(a => new { a.OwnerType, a.OwnerId });

        // Attachment tenant'a ait -> global filtre (tenant izolasyonu).
        modelBuilder.Entity<Attachment>().HasQueryFilter(
            a => a.TenantId == _tenantProvider.GetTenantId());

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