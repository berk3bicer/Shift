# Gün 43 — Onboarding Çekirdeği: E-posta Altyapısı + Davet Akışı + Şifre Sıfırlama

**Kapsam:** Kademe 1'in üç işi tek turda, çünkü üçü aynı temeli paylaşıyor: e-posta gönderimi
+ süreli/tek-kullanımlık token. Bittiğinde: yönetici personeli e-postayla **davet eder**
(şifreyi hiç görmez), personel şifresini linkten kendi belirler, unutan şifresini kendi
sıfırlar. Branch: `feat/davet-eposta-onboarding` → PR → main. Backend 3 commit + FE 1 commit;
133/133 test + canlı uçtan uca doğrulama (davet→şifre→login, forgot→reset→login).

> **Danışman notu:** Sıfırdan güvenlik tasarımı YAPILMADI — kasıtlı. RefreshToken (Gün ~9)
> zaten doğru deseni kuruyordu: ham token'ı değil hash'ini sakla, süre ver, tek kullanım.
> Davet ve reset token'ları o desenin kopyası. En riskli değişiklik `POST /api/staff`'ın
> davranış değişimiydi (artık şifre almıyor, davet gönderiyor) — eski seed akışını etkiler,
> ama dev'de SMTP yoksa e-posta terminale basılıyor, akış SMTP'siz test edilebiliyor.
> Beklenmedik tek gerçek bug: `BCrypt.Verify` boş hash'te false dönmüyor, **patlıyor** —
> davet bekleyen kullanıcı login deneseydi 401 yerine 500 alırdı. Login'e boş-hash koruması
> eklendi; testi de var.

---

## 1. İş 1 — E-posta altyapısı: soyutlama önce, sağlayıcı sonra

`IEmailSender` (Application) tek metotlu sözleşme; `SmtpEmailSender` (Infrastructure, MailKit)
gerçek gönderim; `ConsoleEmailSender` dev fallback'i — `Email:Host` boşsa e-posta loga basılır,
davet/reset linki terminalden tıklanır. DI kayıt anında seçim yapar; handler hangisinin
çalıştığını bilmez.

**Kavram — "bağımlılığı tersine çevir, sağlayıcıyı tak-çıkar yap":** Davet handler'ı
"e-posta nasıl gider" bilmez, "e-posta gider" bilir. Yarın SMTP yerine Resend/SES API'sine
geçmek = tek yeni sınıf + DI'da bir satır; iş mantığına sıfır dokunuş. Test de aynı kapıdan
girer: `FakeEmailSender` gönderilenleri listede biriktirir, test "e-posta gitti mi, linkte ne
var" diye bakar — gerçek e-posta hiç atılmaz.

> [!question] Mülakat Sorusu 1 — **"E-posta gönderimini neden interface arkasına aldınız;
> test ve sağlayıcı değişimi dışında ne kazandırır?"**
> Cevap: (a) Dev/pilot kolaylığı — SMTP yapılandırılmadan sistem çalışır (console fallback),
> (b) katman disiplini — Application dış dünya detayı (MailKit, port, TLS) içermez,
> (c) ileride kuyruk/retry eklemek istersek (e-posta servisi çöktüğünde davet kaybolmasın)
> dekoratörle sarmak mümkün, çağıran kod değişmez. Maliyeti: bir dosya daha. Bu fiyata bu
> esneklik neredeyse her zaman alınır.

---

## 2. İş 2 — Davet akışı: davet = pasif kullanıcı + hash'li token

`POST /api/staff` artık `Password` almıyor. Kullanıcı `IsActive=false` + boş `PasswordHash`
ile açılır; 32 baytlık kriptografik random token üretilir, **SHA-256 hash'i** `OneTimeToken`
tablosuna yazılır (7 gün geçerli), ham token yalnız e-postadaki linkte yaşar:
`{APP_URL}/davet/{token}`. Personel linke tıklar → şifre belirler → `POST /api/auth/accept-invite`
şifreyi koyar, kullanıcıyı aktifleştirir, token'ı tüketir (`IsUsed=true`). Tek SaveChanges → atomik.

**Kavram 1 — "davet = pasif kullanıcı" modeli:** Ayrı bir "davetiye" kaydı yerine gerçek User
hemen açılır ama `IsActive=false`. Kazanç: rol + şube + pozisyon ataması davet ANINDA yapılır
(kabulde veri taşıma yok) ve login'deki mevcut `IsActive` kontrolü davetliyi bedavaya dışarıda
tutar — yeni bir "yarı-kayıtlı kullanıcı" durumu icat edilmedi, var olan durum yeniden kullanıldı.

**Kavram 2 — "token'ı neden hash'liyoruz":** DB'de ham token dursa, DB'yi (veya bir yedeğini,
veya bir log'unu) okuyabilen HERKES herkesin davet/reset linkini üretebilir → hesap ele geçirme.
Hash'le saklayınca DB sızsa bile linkler üretilemez: SHA-256 tek yönlü. Doğrulama tarafı ucuz —
gelen ham token'ı hash'leyip eşleşme ararsın. Şifrelerdeki BCrypt'ten farkı: token zaten 256-bit
random, sözlük/brute-force anlamsız → yavaş+tuzlu hash gereksiz, hızlı SHA-256 yeterli ve
index'lenebilir. (RefreshToken'da da aynı mantık vardı; kopyaladık.)

**Karar — tek entity + `Purpose` enum'u (ayrı `ResetToken` entity'si DEĞİL):** İki token türünün
güvenlik anatomisi birebir aynı (hash + expiry + tek kullanım); fark yalnız süre (7 gün / 1 saat)
ve tüketimde ne yapıldığı — o da zaten handler'ın işi. Ayrı entity = kopya tablo + kopya EF
config + ikinci migration; karşılığında hiçbir tip güvenliği kazanımı yok, çünkü `Purpose`
filtresi her sorguda zaten zorunlu (davet token'ıyla şifre sıfırlanamaz, çapraz kullanım yok).

> [!question] Mülakat Sorusu 2 — **"Davet token'ını neden SHA-256 ile saklayıp şifreyi BCrypt
> ile saklıyorsunuz — ikisi de 'hash' değil mi?"**
> Cevap: Tehdit modeli farklı. Şifre insan üretimi ve düşük entropili → sızarsa sözlük saldırısı
> çalışır → kasıtlı yavaş + tuzlu algoritma (BCrypt) şart. Token bizim ürettiğimiz 256-bit
> random → arama uzayı pratikte taranamaz → hızlı SHA-256 yeterli; ayrıca deterministik olduğu
> için index'te aranabilir (BCrypt her seferinde farklı çıktı verir, arama yapamazsın —
> zaten login'de e-postayla bulup Verify ediyoruz, token'da elimizde e-posta yok).

---

## 3. İş 3 — Şifremi unuttum: aynı desenin küçük kardeşi + enumeration koruması

`POST /api/auth/forgot-password` e-posta alır: kayıtlıysa `Purpose=PasswordReset` token (1 saat)
+ link e-postası; değilse **sessizce hiçbir şey**. İki durumda da HTTP cevabı birebir aynı:
"E-posta kayıtlıysa sıfırlama bağlantısı gönderildi." `POST /api/auth/reset-password` token +
yeni şifreyi alır, şifreyi günceller, token'ı tüketir — ve kullanıcının açık oturumlarını
(refresh token'ları) iptal eder: şifre "ele geçirildi" şüphesiyle değiştiriliyorsa eski
oturumlar da düşmeli.

**Kavram — "enumeration (kullanıcı sayımı) koruması":** Uç "bu e-posta kayıtlı değil" dese,
saldırgan e-posta listesini uca sorarak hangi adreslerin müşteri olduğunu öğrenir (phishing
hedef listesi, veri sızıntısı doğrulama). Cevabı sabitleyince bu kanal kapanır. Bedeli UX'te:
kullanıcı yazım hatası yaptıysa "gönderildi sanıp" bekler — kabul edilen bilinçli takas.
Kalan ince kanal: yanıt süresi farkı (kayıtlıysa e-posta gönderimi var). MVP'de risk kabulü;
sertleştirmek istersek gönderim kuyruğa alınıp cevap sabit sürede döner.

> [!question] Mülakat Sorusu 3 — **"forgot-password neden olmayan e-postaya da 200 döner ve
> bu korumayı hangi yan kanal hâlâ deler?"**
> Cevap: Kullanıcı sayımını önlemek için — cevap farkı, e-postanın sistemde olup olmadığını
> söyleyen bir "oracle" olurdu. Delen kanallar: (a) yanıt süresi (kayıtlı yol e-posta gönderir,
> daha yavaştır) → çözüm asenkron kuyruk/sabit gecikme; (b) register ucu "bu e-posta zaten
> kayıtlı" diyorsa aynı bilgi oradan sızar → oranın da hız limiti/CAPTCHA'sı olmalı. Koruma
> sistem genelinde tutarlıysa anlamlı; tek uçta kozmetikse sadece vicdan rahatlatır.

---

## 4. FE: 3 sayfa + guard istisnası + anonim BFF uçları

`/davet/[token]` (şifre + tekrar → hesap açılır → login'e), `/sifre-sifirla/[token]` (aynı form,
reset), `/sifre-unuttum` (e-posta gir → "varsa gönderildi"), login'e "Şifremi unuttum" linki.
İki altyapı detayı: (1) `proxy.ts` route guard'ı oturumsuz herkesi `/login`'e süpürüyordu —
token sayfaları istisna listesine girdi (davetlinin oturumu OLAMAZ, `IsActive=false`).
(2) Genel BFF proxy'si oturum cookie'si şart koşuyor → üç anonim uç için ayrı, cookie'siz
BFF route'ları açıldı (`/api/auth/accept-invite|forgot-password|reset-password`).

**Not:** Brief'teki "personel ekleme formundan Password alanını kaldır" işi düştü — web'de
henüz personel ekleme formu YOK (settings stub); davetler şimdilik API/seed üzerinden.
Form yapılınca şifresiz doğar.

---

## 5. Canlı doğrulama (dev, console-email fallback ile)

1. Owner ile `POST /api/staff` (şifresiz gövde) → 200, terminale davet e-postası düştü.
2. Davetli login denemesi → **401** (500 değil — boş-hash koruması; eskiden BCrypt patlardı).
3. Terminaldeki `/davet/{token}` linki tarayıcıda → şifre belirlendi → hesap aktif → login **200**.
4. Aynı davet linki ikinci kez → **400** (tek kullanım).
5. `/sifre-unuttum` → "varsa gönderildi"; terminaldeki `/sifre-sifirla/{token}` → yeni şifre.
6. Eski şifre **401**, yeni şifre **200**, aynı reset linki tekrar → **400**.
7. Olmayan e-postaya forgot-password → yine **200** (enumeration koruması canlıda).

**Test:** 133/133 (122 eski + 11 yeni: davet 5, kabul+login regresyonu 5 dosyada, forgot/reset 5).
Fake `IEmailSender` — test hiç gerçek e-posta atmaz, veri id-id.

---

## Açık kalanlar (bilinçli, bu tur DEĞİL)

- **Personel pasifleştirme** — Kademe 1'in son işi, küçük, ayrı tur.
- **Davet yeniden gönderme / iptal** ucu yok (token expire olunca yönetici personeli silip
  yeniden ekleyemez de — e-posta çakışır; "resend-invite" küçük bir iş olarak not edildi).
- **SMS daveti** (spec §5.1) ve **self-service ödeme** (Kademe 3) — ertelendi.
- **Rate limiting** forgot-password'da yok (e-posta bombardımanı mümkün) — prod öncesi iş.
