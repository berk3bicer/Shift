using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Bir personelin GERÇEK giriş-çıkış kaydı (dijital puantaj).
// Planlanan vardiyadan (Shift) farkı: bu gerçekte ne olduğudur.
// Mesai hesabı (Gün 10) bu kayıtların üstüne biner.
//
// "AÇIK KAYIT" deseni: ClockIn bir satır oluşturur (CheckOutTime = null = açık).
// ClockOut aynı satırı bulup CheckOutTime'ı doldurur (kapalı).
// Bir personelin aynı anda yalnızca BİR açık kaydı olabilir.
public class TimeClock : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Puantajı tutulan personel.
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Hangi şubede çalıştı. Puantaj şube bazlı raporlanır.
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    // Giriş anı (UTC). ClockIn'de set edilir, hiç null olmaz.
    public DateTime CheckInTime { get; set; }

    // Çıkış anı (UTC). ClockIn'de NULL (kayıt açık) → ClockOut'ta dolar (kapalı).
    // Null ise personel hâlâ "içeride" / vardiyada demektir.
    public DateTime? CheckOutTime { get; set; }

    // Giriş hangi yöntemle yapıldı. Çıkış da aynı yöntemle varsayılır.
    public ClockMethod Method { get; set; }

    // Geç giriş tespit edildi mi? (o anki vardiyaya göre).
    // Mesai/raporlamada ve yönetici bildiriminde kullanılır.
    public bool IsLate { get; set; } = false;
}

// Giriş-çıkış yöntemi. Spec: QR (personel telefonu) + PIN (tablet/Kiosk).
// GPS/fotoğraf doğrulama Faz 2 → şimdilik yalnızca yöntem tipini tutuyoruz.
public enum ClockMethod
{
    QR = 0,    // Personel kendi telefonundan QR okutur
    PIN = 1    // Paylaşılan tablet (Kiosk Mode) üzerinden PIN
}