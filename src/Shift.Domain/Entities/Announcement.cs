using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Tek yönlü DUYURU (spec Modül 8 — [MVP] kısmı). Yöneticiden role/ekibe; oluşturulunca
// hedef kullanıcılara bildirim (Gün 8 Notification altyapısı yeniden kullanılır).
//
// Kanonik kayıt: "ne duyuruldu, kim duyurdu, kime". Bildirimler bunun fan-out'u.
//
// Faz sınırı: "OkuyanlarListesi" (yöneticiye kim okudu raporu), iç mesajlaşma (iki yönlü),
// zamanlanmış/zorunlu-onaylı duyuru = [Faz 2]. Burada YOK — sadece tek yönlü duyuru.
public class Announcement : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;

    // ── Hedefleme ──
    // BranchId null = tüm şubeler; set = o şubedeki kullanıcılar (UserBranch üzerinden).
    // Şube silinse duyuru geçmişi kalsın, hedef kapsamı çözülsün → SetNull (nullable).
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    // TargetRole null = tüm ekip (herkes); set = o role sahip kullanıcılar
    // (UserRole→Role.Type üzerinden). Enum değer, FK yok.
    public RoleType? TargetRole { get; set; }

    // Duyuruyu yapan yönetici (token'dan). Silinse duyuru durur → SetNull.
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
}
