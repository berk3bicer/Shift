# Gün 45 — Personel Pasifleştirme (Onboarding Çekirdeğinin Son Parçası)

**Kapsam:** İşten ayrılan personeli sistemden çıkarma ucu: `PATCH /api/staff/{id}/deactivate`.
Kademe 1 (onboarding çekirdeği) bununla uçtan uca tamamlandı: davet → kabul → aktif çalışma →
çıkış. Küçük, izole tur: tek endpoint + handler + validator + 7 test; **migration yok**
(`User.IsActive` sütunu zaten vardı). Branch: `feat/personel-pasiflestirme`.
147/147 test + canlı curl doğrulaması (200 → login 401, üç guard 400).

> **Danışman notu:** Bu turun asıl dersi tek satırlık işin etrafındaki karar katmanı.
> `user.IsActive = false` bir satır; onu üretime taşınabilir yapan beş guard ve "silme değil
> pasifleştirme" kararının gerekçesi. Junior ile senior'u ayıran soru "nasıl silerim" değil,
> "silersem bordro geçmişine ne olur"dur.

---

## 1. Karar — silme DEĞİL, pasifleştirme

`User`, FK ile vardiya/puantaj/mesai/checklist/nota bağlı. Fiziksel silme iki şeyi bozar:

1. **Geçmiş bütünlüğü:** tamamlanmış vardiyalar, puantaj ve bordro kayıtları sahipsiz kalır
   (FK cascade ile silinirse geçmiş buharlaşır; RESTRICT ile silinemezse uç zaten çalışmaz).
   Bordro/mesai kayıtlarının yasal saklama yükümlülüğü de var — "işten ayrıldı" verisi
   "hiç çalışmadı" verisine dönüşemez.
2. **Raporlama:** geçen ayın mesai raporu, ayrılan personelin satırlarını hâlâ göstermeli.

Pasifleştirme (`IsActive=false`) kaydı korur, yalnız girişi keser. **Login tarafında ek iş
sıfır çıktı:** `LoginHandler` zaten `!user.IsActive → 401 "Hesap aktif değil"` kontrolü
yapıyordu (davet modeli Gün 43'te bunu kurmuştu — davet-bekleyen de pasif doğar). Yani
pasifleştirme, login'deki mevcut kapıyı yeniden kullanır; yeni durum makinesi kurulmadı.

**Kavram — soft delete ailesi ama aynısı değil:** Klasik soft delete (`IsDeleted` + global
filtre) kaydı *sorgulardan da* gizler. Burada bilinçli olarak öyle değil: pasif personel
staff listesinde `isActive=false` ile görünmeye devam eder (roster geçmişi, rapor,
yeniden-davet). Gizlenen tek şey login yetkisi. "Sil" yerine "durum alanı" deseninin bedeli:
her `IsActive=false` iki anlama gelebilir (aşağıdaki tuzak).

> [!question] Mülakat Sorusu 1 — **"İşten ayrılan kullanıcıyı DB'den siler misin?"**
> Cevap: FK ile operasyonel geçmişe (vardiya/puantaj/bordro) bağlı kullanıcı silinmez —
> cascade geçmişi yok eder, restrict ucu kilitler; ayrıca bordro verisinin yasal saklama
> süresi vardır. Doğru araç durum alanı (`IsActive=false`): login kapanır, geçmiş ve
> raporlama bozulmaz. Fiziksel silme yalnız "hiç iz bırakmamış" kayıtlar veya KVKK/GDPR
> silme talebi gibi ayrı bir süreç için düşünülür — o da çoğu zaman anonimleştirmedir,
> DELETE değil.

## 2. Uç ve guard'lar — `PATCH /api/staff/{id}/deactivate`

`StaffController` altında, sınıf seviyesi `[Authorize(Roles = "Owner,Manager")]`. Resend-invite
deseninin kardeşi; **rate limit bilinçli olarak YOK** — bu uç e-posta/SMS tetiklemiyor
(resend-invite'ta limit vardı çünkü her istek bir e-posta gönderiyordu; burada koruma
maliyetsiz, tehdit yok). Handler beş guard'ı sırayla uygular:

| # | Guard | Sonuç | Gerekçe |
|---|---|---|---|
| 1 | Tenant izolasyonu (global filtre) | 404 | Başka tenant'ın user id'si "yok" muamelesi görür — IDOR koruması, ResendInvite ile birebir |
| 2 | Kendini pasifleştirme | 400 | Kullanıcı kendi hesabını kilitlerse kurtarma derdi doğar; son-owner-kendini-kilitler ucunu da baştan kapatır |
| 3 | Zaten pasif | 400 | İdempotent DEĞİL — yanlış id / çift tık sessizce yutulmaz, dürüst sinyal döner |
| 4 | Son aktif Owner | 400 | Tenant'ın tek aktif sahibi pasifleşirse işletme yönetilemez kalır (ayar/fatura/owner-yetkili işler) — önce başka sahip atanmalı |
| 5 | (İşlem) `IsActive=false` | 200 | Silme yok; login mevcut `!IsActive` kontrolüyle kapanır |

Guard **sırası** da bilinçli: kendini-pasifleştirme, zaten-pasif'ten önce (kendi pasif
hesabını hedefleyen tuhaf istekte doğru mesaj); son-owner kontrolü en pahalı sorgu olduğu
için en sonda (ucuz guard'lar önce eler).

Kimlik `ICurrentUserProvider`'dan (token'dan) okunur, client'tan alınmaz — "kendini
pasifleştirme" kontrolü sahtelenemez (DeleteShiftNote'taki desenle aynı).

**Kavram — son-owner sorgusu:** "Bu user Owner mı?" ve "tenant'ta BAŞKA aktif Owner var mı?"
iki ayrı sorgu. İkincisi `UserRoles → Roles (Type=Owner) → Users (IsActive)` zinciri;
`UserRole` da `ITenantEntity` olduğundan global filtre sorguyu otomatik tenant'a kısıtlar —
"başka aktif Owner" araması yanlışlıkla başka işletmenin sahibini sayamaz.

> [!question] Mülakat Sorusu 2 — **"Deactivate ucunu idempotent yapar mıydın? PATCH zaten
> pasif kullanıcıya 200 mü 400 mü dönmeli?"**
> Cevap: İki savunulabilir okul var. İdempotent-200: retry/çift-tık zararsızlaşır, HTTP
> anlamı "hedef durum sağlandı". Biz 400'ü seçtik çünkü çağıran bir YÖNETİCİ ve "zaten
> pasifti" bilgisi eyleme dönük sinyal — yanlış kişiyi seçmiş olabilir, ya da başka yönetici
> onu çoktan çıkarmıştır (yarış). Sessiz 200 bu iki hatayı da yutar. Kritik olan bilinçli
> seçim + tutarlılık: aynı API'de resend-invite de aynı felsefeyle 400 dönüyor.

> [!question] Mülakat Sorusu 3 — **"Son owner korumasını neden DB kısıtı değil uygulama
> kuralı olarak yazdın?"**
> Cevap: "Tenant başına en az bir aktif Owner" bir *minimum-kardinalite* kuralı — SQL'in
> deklaratif kısıtları (unique, FK, check) tek satır üzerinde çalışır, "en az bir satır
> kalsın" kuralı satırlar-arasıdır; trigger/constraint ile yazmak taşınmaz ve kırılgan olur.
> Uygulama katmanında iki küçük sorgu + anlamlı hata mesajı hem test edilebilir hem
> kullanıcıya yol gösterir ("önce başka sahip atayın"). Yarış koşulu (iki owner birbirini
> aynı anda pasifleştirir) teoride kalır; MVP'de risk kabulü, gerekirse
> serializable-transaction/optimistic-concurrency ile kapatılır.

## 3. Tasarım tuzağı — "zaten pasif" iki durumu kapsıyor

`IsActive=false` iki ayrı gerçeği temsil ediyor: **(a)** davet edilmiş, henüz kabul etmemiş
(hiç aktifleşmemiş) ve **(b)** aktifken pasifleştirilmiş (işten ayrılmış). Guard #3 ikisine de
"Kullanıcı zaten pasif" der. Bu kabul edilebilir — davet-bekleyeni "pasifleştirmek" zaten
anlamsız (login olamıyor) ve tek boolean'ı üç-durumlu enum'a çevirmek bu turun işi değil
(YAGNI). Karar: **şimdilik tek mesaj**; personel yönetim ekranı gelince ayrım UI status'ta
gösterilecek ("davet bekliyor" vs "pasif" — staff listesinde token varlığından türetilebilir,
şema değişmeden).

## 4. Testler ve canlı doğrulama

**7 yeni test** (`DeactivateStaffTests`, in-memory DB + `FakeTenantProvider` +
`FakeCurrentUserProvider`): aktif personel pasifleşir + kayıt silinmez; kendini pasifleştirme
reddedilir; ikinci çağrı (zaten pasif) reddedilir; başka tenant'ın personeli bulunamaz (aynı
store'a farklı tenant gözünden bakan context); son aktif Owner reddedilir (mesaj asserted —
zaten-pasif'le karışmasın); ikinci aktif Owner varken Owner pasifleşir; user'a bağlı TimeClock
kaydı pasifleştirme sonrası yerinde durur (bordro geçmişi kanıtı). **Toplam 147/147.**
`has-pending-model-changes` temiz — migration üretmeden model değişmediği teyitli.

Canlı (dev, curl):
1. Aktif barista pasifleştirildi → **200** "Personel pasifleştirildi." → ardından login
   denemesi → **401 "Hesap aktif değil."** (mevcut login kapısı, ek kod yok).
2. Owner kendini hedefledi → **400** "Kendinizi pasifleştiremezsiniz."
3. Aynı kullanıcıya ikinci deactivate → **400** "Kullanıcı zaten pasif."
4. Manager, tenant'ın tek aktif Owner'ını hedefledi → **400** "Son aktif işletme sahibi
   pasifleştirilemez. Önce başka bir sahip atayın."
(Doğrulama sonrası barista DB'de geri aktifleştirildi — demo verisi bozulmadı.)

---

## Açık kalanlar (bilinçli, bu tur DEĞİL)

- **#staff-manager-scope:** `StaffController` Owner+Manager'a açık ama Manager'ın ŞUBE
  KAPSAMI hiçbir Staff ucunda (Create/Resend/Deactivate) kontrol edilmiyor — Manager başka
  şubenin personelini de ekleyebilir/pasifleştirebilir. Deactivate mevcut desenle bilinçli
  hizalandı (tenant izolasyonu VAR, şube kapsamı YOK); tek uca özel kapsam mekanizması
  kurmak tutarsızlık yaratırdı. Multi-branch pilot gelince kapsam bazlı yetki (spec §3)
  olarak topluca ele alınacak.
- **Yeniden aktifleştirme ucu yok** — pasifleştirilen personel geri dönerse şimdilik yol
  resend-invite (davet akışı şifreyi sıfırdan koydurur, `IsActive=true` yapar). Ayrı bir
  "reactivate" ucu gerekirse personel yönetim ekranıyla birlikte düşünülür.
- **FE personel yönetim ekranı** — pasifleştir/daveti-tekrar-gönder butonları, "davet
  bekliyor vs pasif" status ayrımı; backend uçları hazır, ekran ayrı tur.
