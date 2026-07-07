# Gün 46 — Auth Güvenlik Tutarlılığı (Register Rate-Limit + Forgot Eski-Token İptali)

**Kapsam:** Deploy öncesi iki auth borcu tek turda: (1) `POST /auth/register` rate-limit'siz
kalmıştı → `AuthStrict` (5/15dk, IP bazlı) bağlandı; (2) `forgot-password` yeni reset token
üretirken eskilerini iptal etmiyordu → InvitationService'teki resend deseni PasswordReset'e
uygulandı. Migration yok, iki handler-katmanı dokunuşu + 2 test. Branch:
`feat/auth-guvenlik-tutarliligi`. 149/149 test + canlı curl (429 + eski-link-400/yeni-link-200).

> **Danışman notu:** Bu turun dersi "aynı desenin yarım hali" kavramı. Davet tarafı eski
> token'ları iptal ediyordu, reset tarafı etmiyordu — ikisi de OneTimeToken, ikisi de aynı
> tablo, ama biri güvenli biri değil. Güvenlik deseni bir kez kurulunca her kullanım yerine
> taşınmalı; taşınmazsa kod tabanı "hangisi doğru örnek?" sorusuna iki cevap verir ve bir
> sonraki geliştirici yanlışını kopyalar.

---

## 1. Register neden forgot gibi "sessiz 200" olamaz

`forgot-password` enumeration korumasını **her iki yolda aynı cevabı dönerek** sağlar:
e-posta kayıtlıysa da kayıtlı değilse de `200 "kayıtlıysa gönderildi"`. Bunu yapabilir,
çünkü **hiçbir şey yaratmaz** — başarı ile sessiz-geçiş dışarıdan ayırt edilemez.

Register bunu yapamaz, çünkü **başarıda gerçekten Tenant + User yaratır** ve FE'ye
`{ TenantId, UserId }` dönüp `/onboarding`'e yönlendirir. "E-posta zaten varmış gibi sessizce
başarı dön" iki kötü seçeneğe açılır: ya sahte hesap yaratırsın (veri çöpü + gerçek sahibin
hesabıyla çakışma) ya da FE'yi var olmayan bir hesabın onboarding'ine sokarsın. Ayrıca
global unique constraint gereği ikinci kayıt fiziksel olarak başarısız olmak **zorunda**.

**Bu yüzden register enumeration'ı farklı iki savunmayla zayıflatılır, sıfırlanmaz:**
1. **Rate limit (bu turda eklendi):** otomatik taramayı 5 deneme/15dk'ya düşürür —
   enumeration'ı pratikte işe yaramaz kılar (tekil sorgu hâlâ mümkün, toplu keşif değil).
2. **Mesaj kararı:** aşağıda.

## 2. Register mesaj kararı — Seçenek 1 seçildi

İki seçenek Berke'ye soruldu:

- **Seçenek 1 (seçilen):** "Bu e-posta zaten kayıtlı" mesajı kalır, rate-limit'e güvenilir.
- **Seçenek 2:** kayıtlı e-postada hesap yaratmadan nötr 200 + FE'de bilgi ekranı.

**Neden 1:** Register **kayıt niyeti** olan birinin aksiyonu; forgot ise "bu e-posta var mı?"
diye **anonim yoklama**. Asıl enumeration riski forgot/login'deydi ve onlar zaten kapalı
(Gün 43-44). Register'da mesajı gizlemek FE akışını değiştirir (onboarding yönlendirmesi
bozulur), kazanç ise marjinal — rate limit otomatik keşfi zaten kesiyor. Seçenek 2 burada
over-engineering olurdu.

**Neden `AuthStrict` (5/15dk), `AuthLogin` (10/5dk) değil:** login meşru kullanıcının sık
aksiyonu, cömert limit ister. Register normal kullanıcıda hayatta bir-iki kez olur; dar
pencere kimseyi rahatsız etmez ama spam hesap üretimini ve enumeration'ı ciddi yavaşlatır.
Üstelik register e-posta tetiklemese de **hesap yaratır** — forgot'un "e-posta bombardımanı"
riskinden daha kalıcı bir yan etki.

## 3. Forgot eski-token iptali — IgnoreQueryFilters neden şart

Sorun: her `forgot-password` çağrısı yeni bir reset token üretiyor ama eskileri iptal
etmiyordu → kullanıcı 5 kez forgot derse 5 çalışan reset linki (her biri 1 saat geçerli)
ortalıkta dolaşıyordu. Davet tarafı (`InvitationService.SendInviteAsync`) aynı problemi
Gün 44'te çözmüştü: yeni token'dan önce eski aktif token'ları `IsUsed=true` yap. Aynı blok
PasswordReset'e taşındı; iptal + yeni token **tek SaveChanges'te** yazılır (atomik — ikisi
birlikte ya olur ya olmaz).

**Kritik fark — `IgnoreQueryFilters`:** ShiftDbContext her sorguya otomatik tenant filtresi
basar (multi-tenancy'nin bel kemiği). Ama forgot **anonim** bir uç: istekte JWT yok, tenant
context yok. Bu yüzden handler user'ı zaten `IgnoreQueryFilters` ile buluyor. Eski token
sorgusu da aynı şekilde global olmak **zorunda** — filtreyle yazılsaydı tenant context boş
olduğu için sorgu **hiç token bulmaz** ve iptal **sessizce çalışmazdı**: derleme hatası yok,
exception yok, test-siz fark edilmez bir güvenlik deliği. InvitationService'te
`IgnoreQueryFilters` YOK çünkü çağıranları (CreateStaff, resend) tenant **bağlamında** çalışır
— desen kopyalanırken bu farkın bilinçli eklenmesi gerekiyordu.

## 4. Testler + canlı kanıt

- **`Register_AuthStrict_Politikasina_Bagli`** (RateLimitPolicyTests): reflection ile
  `AuthController.Register` üzerindeki `EnableRateLimiting` attribute'unun `auth-strict`'e
  bağlı olduğunu sabitler. Middleware sayaç testi değil (zaman bağımlı/kırılgan olurdu) —
  attribute yanlışlıkla silinirse test kırılır, kapı sessizce açılamaz.
- **`Iki_Forgot_Yalniz_Son_Token_Calisir`** (PasswordResetTests): iki ardışık forgot →
  ilk linkle reset 400, ikinciyle 200; sonda aktif token kalmadığı da assert edilir.
  (ResendInvite'taki "iki resend → yalnız son link geçer" testinin reset karşılığı.)

Canlı (curl):
- register aynı e-postayla 6 hızlı istek → `200 400 400 400 400 429` (1. kayıt, 2-5 "zaten
  kayıtlı", 6. rate limit).
- forgot ×2 → terminaldeki dev e-postalardan iki link; eski link `400`, yeni link `200`.
  SQL logunda ikinci forgot'un `UPDATE OneTimeTokens SET IsUsed=true` çalıştırdığı görüldü.

Not: `auth-strict` politikasını paylaşan uçlar (register/forgot/reset/accept/resend) **aynı
IP bütçesini** paylaşır — iki canlı kanıt arasında API restart edildi (in-memory sayaç sıfırlanır).

## 5. Mülakat soruları

1. **"Register'da user enumeration'ı nasıl engellersin?"** — Tam engelleyemezsin: unique
   e-posta kısıtı gereği ikinci kayıt başarısız olmak zorunda, forgot'taki "iki yolda aynı
   cevap" hilesi hesap-yaratan uçta çalışmaz. Sinyali zayıflatırsın: IP bazlı dar rate limit
   otomatik taramayı keser; istersen mesajı nötrleştirirsin ama FE akış maliyetiyle. Risk
   analizi: register kayıt niyeti taşır, asıl anonim-yoklama kapıları forgot/login'dir.
2. **"Global query filter kullanan bir sistemde anonim endpoint yazarken neye dikkat
   edersin?"** — Tenant filtresi anonim istekte boş context'le çalışır ve her sorguyu boş
   döndürür. `IgnoreQueryFilters` şart; ama bu bilinçli bir karar olmalı ve o handler'daki
   TÜM sorgularda tutarlı uygulanmalı — biri filtreli kalırsa hata değil, sessiz yanlış
   davranış üretir (bu turdaki iptal sorgusu tam bu tuzaktı).
3. **"Şifre sıfırlama linklerinde neden yalnız en yenisi geçerli olmalı?"** — Her aktif
   link bir saldırı yüzeyi: e-posta kutusuna erişen biri eski bir linki de kullanabilir.
   Kullanıcının zihinsel modeli de "son istediğim link geçerli"dir. Yenisini üretirken
   eskileri iptal etmek (tek transaction'da) pencereyi hep tek linke daraltır.
4. **"Rate limit'i neden e-posta değil IP bazlı yaptın?"** — E-posta bazlı limit sayacın
   kendisi enumeration kanalı olur: "bu e-postaya limit uygulanıyor" = "bu e-posta kayıtlı".
   IP bazlı limit cevap gövdesini değiştirmez; limit aşılana kadar iki yol da aynı görünür.

## 6. Durum

- ✅ Register `auth-strict`'e bağlı (429 canlı doğrulandı), mesaj Seçenek 1 gereği aynı.
- ✅ Forgot eski reset token'larını iptal ediyor (`IgnoreQueryFilters` ile, atomik).
- ✅ 149/149 test (147 + 2 yeni), migration yok (`has-pending-model-changes` temiz).
- Açık işler (değişmedi): #staff-manager-scope, reactivate ucu, FE personel yönetim ekranı,
  FE resend butonu.
