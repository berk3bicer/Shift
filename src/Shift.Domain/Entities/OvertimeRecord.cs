using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Bir personelin BİR dönemdeki (genelde ay) DONMUŞ mesai kaydı.
//
// OvertimeSettings = ayar (çarpanlar), OvertimeCalculator = anlık hesap (saf, yazmaz),
// OvertimeRecord  = o hesabın kapanışta alınmış FOTOĞRAFI (kalıcı, kilitlenebilir).
//
// Neden kalıcı? Calculator her çağrıldığında TimeClock'tan yeniden hesaplar — yani
// geçmişe dönük bir kayıt değişirse sonuç da değişir. Bordro bunu kaldıramaz:
// "Haziran mesaisini ödedim" dediğinde o rakam DONMALI. OvertimeRecord bu dondurma.
//
// Spec (6.2): Id, UserId, Dönem, NormalSaat, FazlaMesaiSaat, Çarpan, Tutar.
// Granülerlik: DÖNEM başına tek kayıt (spec'teki "Dönem" birimi). Haftalık kırılım
// kaybolmasın diye snapshot olarak JSON kolonunda (Weeks) saklanır.
public class OvertimeRecord : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Mesaisi dondurulan personel.
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // ── Dönem sınırları (gün bazlı, kapsayıcı) ──
    // Calculator'a verdiğimiz from/to ile aynı anlam. Genelde ayın 1'i – son günü.
    // İkisini birlikte index'leyip "aynı personele aynı dönem iki kez kapanmasın"
    // kuralını DB'de garantileyeceğiz (DbContext adımında unique index).
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }

    // ── Donmuş saat toplamları (Calculator'ın dönem özetinden kopyalanır) ──
    // Ham toplam = normal + fazla mesai. Üçünü de saklıyoruz ki bordro tekrar
    // hesap yapmasın; kayıt kendi kendine yeten (self-contained) olsun.
    public decimal TotalHours { get; set; }
    public decimal NormalHours { get; set; }
    public decimal OvertimeHours { get; set; }

    // ── Ücret/tutar (spec: Çarpan, Tutar) ──
    // Gün 13'te dolduruldu: kapanışta Calculator brütü hesaplar, snapshot buraya yazılır.
    // nullable = "ücret tanımsız (pozisyon/HourlyRate yok) → hesaplanamadı". null ≠ 0.
    public decimal? AppliedHourlyRate { get; set; }   // kapanış anındaki saat ücreti (snapshot)
    public decimal? OvertimeMultiplier { get; set; }  // kapanışta uygulanan fazla mesai çarpanı (snapshot)

    // ── Gece / hafta sonu primi (snapshot) ──
    // Differential primler: gece/hafta sonu vardiyalarının tüm saatine uygulanan
    // (çarpan−1) farkının lira karşılığı. Brüt'e taban ücretin üstüne eklendi.
    // Tutarı dondurmak çarpanın etkisini dondurur: ayar sonradan değişse de bu kapalı
    // bordro değişmez (Gün 13 snapshot felsefesi). null = ücret tanımsızdı, 0 = prim yoktu.
    public decimal? NightPremium { get; set; }        // gece primi (snapshot)
    public decimal? WeekendPremium { get; set; }      // hafta sonu primi (snapshot)

    public decimal? GrossAmount { get; set; }         // brüt = taban + gece + hafta sonu primi

    // ── Haftalık kırılım snapshot'ı (jsonb) ──
    // Calculator'ın ürettiği hafta hafta kırılımın donmuş kopyası. Denetim/itiraz
    // durumunda "3. hafta neden bu kadar?" sorusunun cevabı burada — ham TimeClock'a
    // dönmeye gerek kalmadan. Sorgulanmaz, hep birlikte okunur, değişmez → JSON ideal.
    public List<OvertimeWeekSnapshot> Weeks { get; set; } = new();

    // ── Kilit (ay kapanış akışı) ──
    // Kayıt oluşturulunca dondurulur. Kilitliyken yeniden hesaplanıp üzerine yazılamaz.
    // Düzeltme gerekirse: kilit aç → yeniden hesapla → tekrar kilitle (audit ile).
    public bool IsLocked { get; set; } = false;
    public DateTime? LockedAt { get; set; }

    // Kapanışı kim yaptı (audit). Owner/Manager. Restrict ile FK (geçmiş uçmasın).
    public Guid? LockedByUserId { get; set; }
    public User? LockedByUser { get; set; }

    // ── Kilit açma audit'i (düzeltme akışı) ──
    // Bir dönem yanlış kapatıldıysa açılır, düzeltilir, yeniden kapatılır.
    // Silmiyoruz — bordroda "kim ne zaman açtı" izi denetim için şart.
    // Son açılışın bilgisi tutulur (tekrar kapatılınca yeni close audit'i LockedAt'i ezer).
    public DateTime? UnlockedAt { get; set; }
    public Guid? UnlockedByUserId { get; set; }
    public User? UnlockedByUser { get; set; }
}

// Dönem kaydının içindeki BİR haftanın donmuş kırılımı.
// Calculator'daki WeeklyOvertimeBreakdown'ın Domain karşılığı — ama bu kalıcı snapshot.
// Neden ayrı tip: Domain, Application'a (WeeklyOvertimeBreakdown'ın olduğu yer) bağımlı
// OLAMAZ. Bağımlılık içe akar. İkisi benzese de sınır bilinçli.
//
// BaseEntity DEĞİL: kendi başına kimliği/yaşam döngüsü yok; sahibi OvertimeRecord ile
// birlikte yaşar ve ölür (owned type → jsonb içinde gömülü durur).
public class OvertimeWeekSnapshot
{
    public DateOnly WeekStart { get; set; }   // Haftanın Pazartesi'si (deterministik)
    public decimal TotalHours { get; set; }   // O hafta ham toplam
    public decimal NormalHours { get; set; }  // Eşiğe kadar
    public decimal OvertimeHours { get; set; }// Eşik üstü (fazla mesai)
}