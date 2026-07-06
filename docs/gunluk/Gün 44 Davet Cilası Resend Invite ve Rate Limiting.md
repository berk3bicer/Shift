# Gün 44 — Davet Cilası: Resend-Invite + Rate Limiting

**Kapsam:** Davet akışının canlıya hazır iki cilası. (1) `POST /api/staff/{id}/resend-invite` —
davet e-postası kaçtıysa/spam'e düştüyse yönetici daveti tekrar gönderir, **eski linkler iptal
olur**. (2) Anonim auth uçlarına ASP.NET yerleşik `RateLimiter` ile IP bazlı hız limiti —
forgot-password açık uçtu, e-posta bombardımanına ve brute-force'a açıktı. Branch:
`feat/davet-cilasi` → PR → main. Backend 3 commit; 140/140 test + canlı 429 doğrulaması.

> **Danışman notu:** İkisi de küçük ama gerçek üretim ihtiyacı — ve ikisinin de "kolay
> yanlışı" var. Resend'in kolay yanlışı: yeni token üretip eskiyi unutmak (her resend bir
> çalışan davet kapısı daha bırakır). Rate limit'in kolay yanlışı: limiti e-posta bazlı
> kurup dün inşa edilen enumeration korumasını bugün delmek. İki incelik de bu turda
> bilinçli kararla kapandı. Refactor (InvitationService) üçüncü kazanç: CreateStaff ile
> resend aynı kod yolunu paylaşıyor, davranış sapması imkânsız.

---

## 1. İş 1a — Refactor: davet gönderimi `InvitationService`'e

`CreateStaffHandler`'daki "token üret + hash'le + kaydet + e-posta gönder" bloğu
`Application/Common/Services/InvitationService.SendInviteAsync(user)` olarak çıkarıldı;
CreateStaff ve resend-invite aynı servisi çağırıyor. Servis ayrıca **eski aktif Invite
token'larını iptal ediyor** (`IsUsed=true`) — CreateStaff'ta bu sorgu boş döner (yeni
kullanıcının eski token'ı yok), davranış birebir aynı kalır; resend'de ise işin kalbidir.

İnce nokta — atomiklik bozulmadı: `SaveChanges` artık serviste ama CreateStaff'ın bekleyen
ekleri (User + rol + şube) token'la **aynı** `SaveChanges`'te yazılıyor; e-posta yine kayıttan
sonra gidiyor. Mevcut 133 test refactor'dan sonra dokunulmadan geçti (regresyon kanıtı) —
yalnız handler kurucusuna geçen bağımlılıklar değişti.

**Kavram — "neden eski token iptal edilmeli":** Token doğrulama gelen ham token'ı hash'leyip
`TokenHash` eşleşmesi arar — kullanıcı başına *tek* aktif token varsaymaz. İptal edilmezse
iki kez resend yapan yöneticinin personeline giden 3 e-postanın **üçündeki link de çalışır**;
spam'e düşen, yanlış kutuya giden her eski e-posta süresi dolana dek açık bir hesap-açma
kapısıdır. Kural basit: *bir kullanıcı için aynı anda en fazla bir çalışan davet linki.*
Aynı mantık şifre-sıfırlamada da geçerli (forgot-password'a da eklenebilir — açık kalanlarda).

> [!question] Mülakat Sorusu 1 — **"Daveti tekrar gönder ucu yazıyorsun; en kritik iki
> güvenlik detayı ne?"**
> Cevap: (1) Eski aktif token'ları iptal et — doğrulama hash üzerinden tek tek baktığı için
> iptal edilmeyen her eski link çalışmaya devam eder; resend sayısı kadar açık kapı birikir.
> (2) Zaten aktif kullanıcıya resend'i reddet — accept-invite şifreyi *sıfırdan* koyar, aktif
> hesaba davet linki göndermek "yöneticinin tek tıkla personelin şifresini ele geçirmesi"
> demektir (link personelin e-postasına gider ama e-posta kutusu ele geçmişse hesap da gider;
> ayrıca kötü niyetli yönetici senaryosunda denetim izi bulanıklaşır).

## 2. İş 1b — Uç: `POST /api/staff/{id}/resend-invite`

`StaffController` altında, sınıf seviyesi `[Authorize(Roles = "Owner,Manager")]` aynen
geçerli — Create hangi kapsamı uyguluyorsa resend de onu uyguluyor (Create'te şube-bazlı
Manager kısıtı yok, resend'de de yok; tutarlılık). Kurallar:

- Hedef kullanıcı **bu tenant'ta** olmalı — global filtre başka tenant'ın kullanıcısını
  görünmez kılar → 404 "Kullanıcı bulunamadı".
- Kullanıcı **hâlâ davet-bekliyor** (`IsActive=false`) olmalı → aktifse 400 "Kullanıcı zaten
  aktif, davet gerekmez".
- Geçerse `InvitationService.SendInviteAsync` → eskiler iptal + yeni token + e-posta → 200.

**Test (4 yeni):** pasif kullanıcıya resend yeni token üretir + eskiyi iptal eder + e-posta
gider; iki resend sonrası **yalnız son link** accept-invite'tan geçer, önceki ikisi reddedilir
(uçtan uca, ham token'lar fake e-postalardan sökülerek); aktif kullanıcıya resend reddedilir
(token üretilmez, e-posta gitmez); başka tenant'ın kullanıcısı **aynı DB store'una** farklı
tenant gözünden bakan context'te bulunamaz.

## 3. İş 2 — Rate limiting: anonim auth uçları, IP bazlı

ASP.NET Core yerleşik `RateLimiter` middleware'i kuruldu (`AddRateLimiter` + `UseRateLimiter`,
auth middleware'lerinden ÖNCE — limit anonim istekleri de saymalı). İki named policy, ikisi de
IP partisyonlu fixed-window, `QueueLimit=0` (aşan istek beklemez), aşımda **429**:

| Policy | Uçlar | Limit | Niyet |
|---|---|---|---|
| `auth-strict` | forgot-password, accept-invite, reset-password, resend-invite | 5 istek / 15 dk / IP | e-posta bombardımanı + token brute-force önleme |
| `auth-login` | login | 10 istek / 5 dk / IP | brute-force yavaşlatma, normal girişe cömert |

Değerler `AuthRateLimitPolicies`'te tek yerde; konfig testle sabitlendi (3 yeni test) —
middleware'in sayacını test etmek zaman-bağımlı/kırılgan olurdu, onun yerine canlı curl
doğrulaması yapıldı (aşağıda). Login/refresh normal akışı kısıtlanmadı; refresh'te limit yok
(oturumlu, saniyede bir çağrılmaz), register şimdilik limitsiz — açık kalanlarda.

**Kavram — "rate limit + enumeration koruması birlikte yaşamalı":** Dün forgot-password'a
"e-posta kayıtlı olsa da olmasa da aynı 200" korunması kuruldu. Bugün eklenen limit bunu
BOZMAMALI: limit **IP bazlı** olduğu için cevap, sorulan e-postadan bağımsız — limit aşılana
kadar herkes aynı 200'ü, aşınca herkes aynı 429'u görür. Limit **e-posta bazlı** olsaydı
saldırgan "kayıtlı e-postalar farklı sayaçta mı ilerliyor?" gibi yan kanallar arayabilirdi ve
daha kötüsü: bir kurbanın e-postasına 5 istek atıp kurbanın *gerçek* şifre-sıfırlama talebini
429'a toslatabilirdi (hedefli servis dışı bırakma). IP bazlı limitin bedeli de bilinçli:
NAT arkasındaki ofis/okul aynı sayacı paylaşır ve dağıtık (botnet) saldırıyı tek başına
durdurmaz — o katman için CAPTCHA/WAF gerekir, MVP'de risk kabulü.

> [!question] Mülakat Sorusu 2 — **"forgot-password'a rate limit ekliyorsun; limiti neden
> IP bazlı kurarsın, e-posta bazlı değil?"**
> Cevap: E-posta bazlı sayaç iki şey sızdırır/bozar: (1) sayacın davranış farkı e-postanın
> kayıtlı olup olmadığına dair yan kanal olabilir (enumeration korumasının amacını deler);
> (2) saldırgan kurbanın e-postasını kasıtlı limitleyip kurbanın gerçek talebini engeller
> (hedefli DoS). IP bazlı limitte cevap e-postadan bağımsız kalır. Eksileri de söylenmeli:
> NAT paylaşımı (yanlış pozitif) ve dağıtık saldırı (yanlış negatif) — tam çözüm katmanlıdır:
> IP limiti + gönderim tarafında alıcı-başına e-posta throttle'ı + gerekirse CAPTCHA.

> [!question] Mülakat Sorusu 3 — **"Rate limit'i nasıl test edersin? Middleware sayacını
> birim teste almanın sorunu ne?"**
> Cevap: Sayaç zamana bağlı — pencere sınırında koşan test flaky olur; paralel test koşusunda
> sayaçlar birbirine karışır. Pratik katmanlama: (1) *konfig testi* — policy değerleri
> (limit/pencere/kuyruk) ve policy adları assert edilir, yanlışlıkla değişim/yeniden
> adlandırma yakalanır (adlar attribute'larda string yaşar, yazım hatası limiti sessizce
> kapatır); (2) *canlı/entegrasyon doğrulaması* — aynı IP'den N+1 istekte 429 tek kez,
> elle ya da ayrı bir smoke ortamında; (3) kabul: davranışın kalbi framework'ün test
> edilmiş kodu, bizim yüzeyimiz konfig + hangi uca hangi policy.

---

## 4. Canlı doğrulama (dev)

1. Aynı IP'den art arda `POST /api/auth/forgot-password` → **ilk 5 istek birebir aynı 200**
   ("E-posta kayıtlıysa..."), **6. ve 7. istek 429** — limit çalışıyor, enumeration koruması
   limit aşılana dek bozulmuyor.
2. Strict kova doluyken `POST /api/auth/login` → **401** (429 değil) — login ayrı policy'de,
   kova paylaşımı yok.

**Test:** 140/140 (133 eski + 7 yeni: resend-invite 4, rate limit konfig 3). Fake
`IEmailSender` — test gerçek e-posta atmaz; canlı doğrulamada DB'ye veri yazılmadı
(olmayan e-posta + yanlış şifre ile).

---

## Açık kalanlar (bilinçli, bu tur DEĞİL)

- **FE "Daveti tekrar gönder" butonu** — web'de personel yönetim ekranı henüz YOK (staff
  listesi yalnız dropdown'ları besliyor); buton "küçük ek" değil yeni sayfa demek. Backend
  ucu hazır; personel yönetim ekranıyla birlikte ayrı tur.
- **Personel pasifleştirme** — Kademe 1'in son işi, ayrı tur.
- **Forgot-password'da eski reset token iptali** — davetteki "tek aktif link" kuralının
  aynısı reset'e de uygulanabilir; küçük iş, not edildi.
- **Limiter'ın dağıtık hâli** — sayaçlar bellek-içi; tek instance'ta doğru, yatay ölçekte
  instance başına ayrı sayaç olur (Redis tabanlı store prod-ölçek işi).
- **Register ucu limitsiz** ve "bu e-posta zaten kayıtlı" diyor — enumeration oradan hâlâ
  sızıyor; prod öncesi aynı `auth-strict` şemsiyesine alınmalı.
