using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Kullanıcıya gönderilen KALICI bildirim kaydı (inbox / bildirim merkezi).
// Gerçek-zamanlı push (SignalR/FCM) bunun ÜSTÜNE gelir — önce kayıt kalıcı olmalı
// ki kullanıcı sonradan açıp görebilsin. Spec: "Bildirim merkezi (Inbox)".
public class Notification : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Bildirimi alan kullanıcı.
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }

    // Kullanıcıya gösterilecek metin. ("Haftalık programınız yayınlandı." gibi)
    public string Message { get; set; } = null!;

    // Bildirimin işaret ettiği kaydın id'si (opsiyonel).
    // Örn: yayınlanan vardiyanın id'si → frontend "tıkla, vardiyaya git" yapar.
    // Tipi Type'a göre yorumlanır (polimorfik referans).
    public Guid? RelatedEntityId { get; set; }

    public bool IsRead { get; set; } = false;
}

// Bildirim tipleri. Şimdilik tek tip; her yeni olay buraya eklenir
// (izin onaylandı, görev atandı, stok uyarısı...). Spec'teki olay→bildirim tablosu.
public enum NotificationType
{
    ShiftPublished = 0,  // Vardiya/program yayınlandı
    LateClockIn = 1,     // Personel vardiyasına geç giriş yaptı
    TaskAssigned = 2,    // Sana (veya pozisyonuna) bir görev atandı
    TaskCompleted = 3,   // Atadığın görev tamamlandı (atayana/oluşturana gider)
    AnnouncementPosted = 4  // Sana yönelik bir duyuru yayınlandı
}