# Shift — Gün 32: Faz 2 İnşa Turu #3 — Sahip Kaydı (Register) + Kurulum Sihirbazı (Onboarding)

> [!info] Bugünün hedefi 7shifts mantığında **"kaydol → kurulum sihirbazı → dashboard"** akışını kurmak. Register backend'i (`POST /api/auth/register`) Faz 0'da zaten vardı ama **frontend'de kayıt ekranı yoktu** ve handler yalnızca **Tenant + Owner User + Owner rolü** yaratıyor — **şube/pozisyon YARATMIYOR**. Yani yeni sahip kayıt olur olmaz şubesiz/pozisyonsuz, kullanılamaz bir hesapla kalıyor. Bu yüzden kurulum sihirbazı süs değil, **fonksiyonel zorunluluk**. Tur **frontend ağırlıklı**: backend'e migration YOK, mevcut uçlara dokunma YOK.

**Tarih:** 2 Temmuz 2026 **Stack:** Next.js 16.2.9, React 19, TypeScript, .NET 10, PostgreSQL **Durum:** ✅ Gün 32 tamamlandı — Register ekranı + BFF register (kayıt+oto-login) + 3 adımlı Onboarding wizard (şube→pozisyon→bitir) + "0 şube → /onboarding" tespiti, uçtan uca tarayıcı+curl+psql doğrulandı. **1 gerçek bug bulundu ve kapatıldı** (proxy.ts `/register`'ı login'e sekiyordu).

---

## 1. Neden wizard? — "Register var" ile "kurulum var" aynı şey değil

`RegisterHandler` üç satırlık iş yapıyor: yeni `Tenant`, ilk `User` (sahip), `UserRole(Owner)`. Şube/pozisyon **yok**. Karar: **handler'a DOKUNMA, kayıtta seed YAPMA.** Gerekçe iki başlık:

1. **Regresyon riski:** kayıt handler'ı Faz 0'da doğrulandı; genişletmek test/regresyon yüzeyi açar.
2. **Esneklik:** sahip kendi şube adını girer. Varsayılan "Merkez Şube" seed'lersek kullanıcı onu silmek/yeniden adlandırmak zorunda kalır. Sihirbaz orkestrasyonu daha temiz — kullanıcı ne girerse o yazılır.

Yani kurulum işi frontend'e taşındı: wizard mevcut `POST /api/branches` + `POST /api/positions` uçlarını sırayla çağırır.

> [!question] Mülakat Sorusu **"Kayıt sırasında şube+pozisyonu tek transaction'da seed etmek daha atomik olmaz mı?"** Cevap: Atomiklik burada yanlış hedef. Kullanıcı verisi (şube adı, pozisyon isimleri/renkleri) kayıt anında henüz **bilinmiyor** — onları sormak için ayrı bir UI adımı şart. Kayıtta placeholder seed'lersek kullanıcı sonra bunları düzeltmek/silmek zorunda (negatif iş). Doğru sınır: kayıt = kimlik yaratımı (atomik, tek transaction); kurulum = kullanıcı-güdümlü ayrı akış (idempotent, kaldığı yerden devam eder). İkisini birleştirmek "boş kabuk hesap" ile "kullanıcı girdisi" arasındaki doğal sınırı bulanıklaştırır.

---

## 2. Parça A — Register ekranı + BFF register (kayıt + otomatik oturum)

### Backend token DÖNMÜYOR → BFF register içinde sessiz login
`POST /api/auth/register` yalnızca `{ tenantId, userId }` döner — **token YOK**. Login ise `{ token, ... }` döner. Bu yüzden yeni bir BFF route yazdım: `app/api/auth/register/route.ts`:
1. `.NET`'e `/api/auth/register` → başarılıysa
2. **aynı e-posta/şifre ile** `.NET`'e `/api/auth/login` → dönen `token`'ı httpOnly cookie'ye yaz (login route ile birebir aynı desen).

Böylece kullanıcı kayıt biter bitmez **otomatik oturumlu**. Token tarayıcı JS'ine hiç verilmez (BFF deseni korunur).

> [!important] Login parse tuzağı — token alanı `token`, `accessToken` DEĞİL Backend `LoginResponse.token` döner. `data.accessToken` okusaydık `undefined` cookie'ye yazılır, sonraki her istek 401 alırdı. Mevcut login route'undan birebir kopyalandı.

### Client validation backend `RegisterValidator` ile aynalı
`RegisterValidator`: BusinessName NotEmpty/≤150, BusinessType 0..3, FullName NotEmpty/≤150, Email EmailAddress, Password MinLength(8). Register formu bu kuralları client'ta aynalar (sunucuya gitmeden uyarır) ama **son söz backend'de** — "e-posta zaten kayıtlı" gibi sunucu-only kurallar temiz hata gösterir, çökmez.

**İşletme tipi:** `BusinessType` enum aslında 4 değer (Cafe=0, Restaurant=1, Bakery=2, FastFood=3). Brief 2 taneden söz ediyordu ama validator `InclusiveBetween(0,3)` — dördünü de sundum (Kafe varsayılan seçili), yoksa Fırın/FastFood seçen sahip 400 alırdı.

---

## 3. Parça B — Onboarding wizard (`/onboarding`, `(app)` DIŞINDA)

### Route grubu kararı: neden `(app)` içinde değil
`(app)/layout.tsx` her sayfada `getBranches` + şube seçici çalıştırır. Yeni sahip **şubesiz** → `getBranches` boş → seçici anlamsız / boş context. Gün 31'in "(app) layout Staff'ı guard'lıyor" dersinin aynısı: onboarding'i `(app)` dışında, kendi sade kabuğunda tut. Route: `app/(onboarding)/onboarding/page.tsx`.

### 3 adımlı state machine (tek sayfa, client component)
- **Adım 1 — Şube:** ad (zorunlu) + adres (opsiyonel) → `POST /api/branches` → `branchId` state'e.
- **Adım 2 — Pozisyonlar:** kafe hazır önerileri (Barista/Kasiyer/Komi, tek tıkla ekle, varsayılan renk) + manuel ekle. Her biri → `POST /api/positions` → `positionId`.
- **Adım 3 — Bitir:** özet ("1 şube, N pozisyon") → "Panele git" → `/dashboard`.

### İki DTO tuzağı (Kılavuz'dan, curl ile doğrulandı)
> [!important] POST `branchId`/`positionId` döner, LIST `id` döner `CreateBranchResult(BranchId)` / `CreatePositionResult(PositionId)` — yani **oluşturma** yanıtı `branchId`/`positionId` anahtarı taşır. Ama `GET /api/branches` ve `GET /api/positions` **`id`** anahtarı döner. Resume (aşağıda) LIST'ten okuduğu için `p.id`, wizard oluştururken `data.positionId` parse eder — ikisi ayrı tutulmalı. `data.id` okusaydık oluşturma sonrası `undefined` id ile state bozulurdu.

> [!important] Unique index tuzağı — aynı ada 2. pozisyon = backend 400 `Positions` tenant içinde ada-unique. Aynı isimle 2. POST → `"Bu isimde bir pozisyon zaten var."` (400). Wizard bunu **UI'da baştan engeller**: eklenen isimler `Set`'te (Türkçe locale lowercase), hem öneri çipi disabled ("Barista ✓") hem manuel "Ekle" butonu duplicate'te disabled. Backend'e hiç düşmeden.

### Idempotent resume — yarıda bırak, kaldığın yerden devam
Onboarding **server component** olarak `getBranches()` + `getPositions()` çeker, client wizard'a `initial*` olarak verir. Kullanıcı Adım 2'de çıkıp tekrar `/onboarding`'e gelirse: zaten kurulu şube varsa **doğrudan Adım 2'den** başlar, kurulu pozisyonlar listede gelir, tekrar eklenemez → **çift kayıt yok**. "Kurulmuş gibi" his.

> [!question] Mülakat Sorusu **"Wizard state'i localStorage'a yazsan resume daha basit olmaz mı?"** Cevap: Olmaz, hatta yanıltıcı olur. localStorage istemciye bağlı ve **gerçeği yansıtmaz** — kullanıcı başka cihazdan girse ya da storage temizlense "kurulmuş" pozisyonu tekrar POST'lar → unique index'e 400 çarpar. Tek gerçek kaynak **backend**: her açılışta `GET /branches` + `GET /positions` ile fiili durumu oku, wizard'ı ona göre kur. Server-side kaynak = hangi cihaz/oturum olursa olsun tutarlı, çift-kayıt imkânsız.

---

## 4. Parça C — "Kurulum tamamlandı mı" tespiti (backend'e SIFIR dokunuş)

**Yol (1) — saf frontend (seçilen):** `app/page.tsx` (kök) yönetici için `getBranches()` çağırır; **boş dizi → henüz kurulmamış → `/onboarding`**, dolu → `/dashboard`. Ekstra alan/migration yok. Staff bu dala girmez (davetle gelir, şubesi vardır → `getBranches` çağrılmaz).

**Emniyet ağı:** `(app)/layout.tsx` de yönetici + 0 şube görürse `/onboarding`'e atar — sahip elle `/dashboard` yazsa bile boş şube-seçiciyle bozuk panele düşmez.

Yol (2) (`/me`'ye türetilmiş `hasBranches`) **gerekmedi** — getBranches Owner'a 403 vermiyor (curl doğruladı), erken çağrıda patlamıyor. Backend'e dokunmadan bitti.

> [!question] Mülakat Sorusu **"Her kök ziyaretinde ekstra `getBranches` çağrısı israf değil mi?"** Cevap: Maliyet gerçek ama küçük ve tek yerde: kök yönlendirme zaten `getMe` çağırıyor, yanına bir hafif sorgu ekleniyor (yönetici için, oturum başına birkaç kez). Alternatif — `/me`'ye `hasBranches` projeksiyonu eklemek — backend dokunuşu + test güncellemesi demek; brief "backende dokunma" sınırı koyduğu için ödünç doğru: **sıfır backend riski** > birkaç ms sorgu. Ölçek büyürse (2) yoluna geçmek tek satırlık projeksiyon (Gün 31'deki `branchId` eklenişi gibi), o zaman ölçülüp taşınır.

---

## 5. Bulunan bug — `proxy.ts` (Next 16 middleware) `/register`'ı `/login`'e sekiyordu

> [!bug] Auth guard yalnızca `/login`'i oturumsuz erişime açıyordu Next 16'da middleware = `proxy.ts`. Kuralı: "oturum yoksa `/login` hariç her şey → `/login`". Ama yeni sahibin **henüz oturumu yok** ve `/register`'a gitmesi gerekiyor — guard onu anında `/login`'e sekiyordu, kayıt ekranı **hiç açılmıyordu** (server log'da `GET /register` bile görünmüyordu). Düzeltme: `isAuthPage = pathname === "/login" || pathname === "/register"` — `/register` de oturumsuz erişilebilir auth sayfası. Tarayıcı doğrulaması olmadan (yalnız derleme) bu **asla fark edilmezdi** — tsc temiz, hiçbir tip hatası yok, ama akış tümüyle kırık.

> [!important] "Derleme yeşili" ≠ "akış çalışıyor" (Gün 31 dersinin tekrarı) Register/onboarding kodu kusursuz derlendi; tsc 0. Ama gerçek "geçti" = **oturumsuz tarayıcıyla `/register`'a git → form açıldı mı?**. Middleware seviyesindeki redirect'i ancak canlı navigasyonla yakaladım. Rota-koruma davranışı yalnız gerçek istekle test edilir.

---

## 6. Geçti Kriteri — tarayıcı + curl + psql (derleme değil)

| # | Senaryo | Sonuç | Doğrulama |
|---|---------|-------|-----------|
| 1 | `/register` → yeni sahip | DB'de yeni Tenant + Owner User + UserRole(`1111…`), 0 şube | psql |
| 2 | Kayıt sonrası | otomatik oturum (cookie yazıldı) → **`/onboarding`** (dashboard değil) | tarayıcı |
| 3 | Wizard Adım 1 | `POST /branches` → DB'de şube, doğru TenantId | curl+psql |
| 4 | Wizard Adım 2 | her pozisyon `POST /positions`; aynı ada 2. = 400 (`"zaten var"`) | curl |
| 5 | Dupe engeli | çip "Barista ✓" disabled + "Ekle" disabled (case-insensitive `barista`) | tarayıcı |
| 6 | Adım 3 "Panele git" | `/dashboard` **bütün açıldı** (500 yok), Merkez şube seçicide | tarayıcı |
| 7 | **Yarıda bırak-devam** | tekrar `/onboarding` → Adım 2, 3 pozisyon listede, Barista/Kasiyer disabled, Komi açık, **çift kayıt yok** | tarayıcı |
| 8 | **Regresyon (Owner)** | `berke@berkekahve.com` (3 şube) login → **doğrudan `/dashboard`**, onboarding'e DÜŞMÜYOR | tarayıcı |
| 9 | **Regresyon (Staff)** | `ayse.yilmaz@…` login → **`/today`** (değişmedi) | tarayıcı |
| 10 | E-posta zaten kayıtlı | UI temiz hata `"Bu e-posta zaten kayıtlı."`, çökme yok, `/register`'da kalır | tarayıcı |
| 11 | tsc / dotnet / test | tsc **0**, dotnet **0 hata**, **114/114 test yeşil** | terminal |
| 12 | Migration | `has-pending-model-changes` = **"No changes"** (Yol 1, backend'e sıfır dokunuş) | dotnet ef |

---

## 7. Açık gap'ler (etiketlendi, kapatılmadı)

- **gap #A — Departman kavramı:** 7shifts'te Position üstü "Department" var, bizde YOK. Bu tur eklenmedi (Position yeterli). İleride şube→departman→pozisyon hiyerarşisi gerekebilir.
- **gap #B — Wizard'da çalışma saatleri / şube GPS:** Adım 1 yalnız ad+adres; çalışma saatleri ve lat/long (clock-in geo-fence için) MVP'de atlandı. `CreateBranchCommand` lat/long alanları var ama wizard göndermiyor (null).
- **gap #C — Çoklu şube kurulumu:** wizard tek şube kuruyor. Zincir işletme (birden çok şube) wizard'da desteklenmiyor — sahip sonra Ayarlar'dan ekleyebilir ama sihirbaz akışı tek şube varsayar.
- **gap #D — BusinessType'a göre pozisyon önerisi:** öneriler her tip için kafe-odaklı (Barista/Kasiyer/Komi). Restoran/Fırın seçen sahibe farklı öneri seti gösterilmiyor.
- **gap #E — Pozisyon rengini wizard'da değiştirme:** varsayılan renkler atanıyor (öneriler sabit, manuel için döngüsel palet) ama kullanıcı wizard içinde rengi **seçemiyor** — sonra Ayarlar'dan düzenler. (Brief "kullanıcı değiştirebilsin" diyordu; renk-seçici UI bu tura sığmadı → gap.)

---

## 8. Değişen/eklenen dosyalar

**Yeni:**
- `web/app/api/auth/register/route.ts` — BFF register (kayıt + sessiz oto-login)
- `web/app/(auth)/register/page.tsx` — kayıt formu (client validation, 4 işletme tipi)
- `web/app/(onboarding)/onboarding/page.tsx` — sihirbaz server kabuğu (resume için getBranches/getPositions)
- `web/components/OnboardingWizard.tsx` — 3 adımlı client state machine
- `web/.claude/launch.json` — preview dev server tanımı (doğrulama için)

**Değişen:**
- `web/lib/api-client.ts` — `createBranch` + `createPosition` (POST `branchId`/`positionId` parse)
- `web/app/page.tsx` — yönetici + 0 şube → `/onboarding` (Yol 1 tespit)
- `web/app/(app)/layout.tsx` — emniyet ağı: yönetici + 0 şube → `/onboarding`
- `web/proxy.ts` — **BUG FIX:** `/register` oturumsuz erişilebilir auth sayfası (login'e sekmesin)
- `web/app/(auth)/login/page.tsx` — "Hesabın yok mu? Kayıt ol" linki

**Backend:** hiç dokunulmadı (migration yok, mevcut uçlar değişmedi).
