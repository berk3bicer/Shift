# Shift — Gün 21: Frontend İlk Dikey Dilim (Login → Vardiya Çizelgesi, Uçtan Uca)

> [!info] Bugünün hedefi Frontend'e **dikey dilim disipliniyle** giriş — "tüm ekranlar" değil. Tek dilim: **login → token sakla → vardiya çizelgesi (okuma)**, uçtan uca çalışır. Yönetici web ile başladık (spec: web ana platform). Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4. Backend'e DOKUNMADAN sadece mevcut API tüketildi.

**Tarih:** 25 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4 / Backend: .NET 10 **Durum:** ✅ Gün 21 tamamlandı — login→çizelge uçtan uca doğrulandı (curl)

---

## 1. Dikey Dilim Disiplini: Bir Akış, Uçtan Uca

"Tüm yönetici ekranlarını" yapmak yerine TEK akışı uçtan uca bitirdik: login formu → kimlik → korunan çizelge sayfası → gerçek veriyle render. Neden: dikey dilim, mimarinin TÜM katmanlarını (auth, API client, routing, render) erkenden test eder; yatay dilim (önce tüm UI, sonra tüm API) entegrasyonu sona bırakır ve sürprizleri biriktirir.

> [!question] Mülakat Sorusu **"Yeni bir frontend'e başlarken yatay mı dikey mi ilerlersin?"** Cevap: Dikey — tek bir kullanıcı akışını (ör. login→liste) uçtan uca çalışır hale getiririm. Bu, auth/routing/veri/render katmanlarının gerçekten birbirine bağlandığını erken kanıtlar ve riski öne çeker. Yatay (tüm ekranlar yarım) ilerleyince entegrasyon en sona kalır, en pahalı sürprizler orada çıkar.

---

## 2. Önce Gerçek Sözleşmeyi Oku (Varsayma)

Kod yazmadan önce backend controller'larından **gerçek** sözleşmeyi çıkardık: `POST /api/auth/login` → `{ token, refreshToken, userId, tenantId }` (token alanı `token`, accessToken DEĞİL); `GET /api/shifts?branchId&rangeStart&rangeEnd` → `ShiftDto[]`; ProblemDetails hata şekli. TypeScript tiplerini (`lib/types.ts`) bu gerçeğe göre yazdık.

İki kritik bulgu sözleşmeden çıktı: **CORS yok** ve **HTTPS redirect açık**. İkisi de mimariyi etkiledi (aşağıda). Varsayımla başlasaydık ikisi de runtime'da patlardı.

> [!important] Sözleşme, dokümandan değil koddan Backend'in döndürdüğü gerçek alan adları/şekli, hayal ettiğin değil. Token alanının `token` olması, status'ün int (0/1) olması koddan okundu. Frontend tipleri backend'i birebir yansıtır → derleme zamanı uyumu.

---

## 3. BFF Deseni: CORS'u Backend'e Dokunmadan Aşmak

Backend'de CORS yok → tarayıcı `:3000`'den `:5203`'ü doğrudan çağıramaz. Ama "backend'e dokunma" kuralı var. Çözüm: **Next.js'i ince proxy (BFF) yap** — tarayıcı same-origin Next'e gider, Next SUNUCUSU .NET'i server-to-server çağırır (CORS kuralı tarayıcıya özgü; sunucu-sunucu çağrıda yok).

İki yol:
- **Server component'ler** .NET'i doğrudan çağırır (`lib/api-server.ts`, cookie'den token okur). Çizelge sayfası böyle.
- **Client etkileşimi** Next route handler'larına gider (`/api/auth/login`), o da .NET'e iletir. Login böyle.

> [!question] Mülakat Sorusu **"Farklı origin'deki bir API'yi, o API'ye CORS ekleyemeden tarayıcıdan nasıl tüketirsin?"** Cevap: Frontend sunucusunu BFF/proxy olarak kullanırım — tarayıcı same-origin kendi sunucuma gider, sunucu API'yi server-to-server çağırır. CORS yalnız tarayıcı kaynaklı çağrılarda uygulanır; sunucudan sunucuya geçerli değil. Bonus: token'ı httpOnly cookie'de tutup tarayıcıdan gizleyebilirim.

---

## 4. httpOnly Cookie: Token Tarayıcı JS'ine HİÇ Verilmez

Token `localStorage` yerine **httpOnly cookie**'de (BFF login route'u set eder). Tarayıcı JS'i token'a erişemez → XSS ile token çalınamaz. Akış: client form → `/api/auth/login` (Next) → .NET login → token cookie'ye yazılır, **gövdeye konmaz** (`{ok:true}` döner). Sonraki tüm veri çağrıları cookie'yi taşır; Next sunucusu okuyup Bearer'a çevirir.

Doğrulama (curl): login yanıtında `Set-Cookie: shift_token=...; HttpOnly; SameSite=lax; Max-Age=3600` ve gövdede token YOK.

> [!question] Mülakat Sorusu **"JWT'yi tarayıcıda nerede saklarsın: localStorage mı httpOnly cookie mi?"** Cevap: Güvenlik öncelikse httpOnly cookie — JS erişemez, XSS token'ı sızdıramaz. localStorage basittir ama her XSS açığı token'ı açık eder. Cookie'de CSRF'e karşı SameSite + (gerekirse) CSRF token gerekir. BFF ile cookie'yi sunucu yönetir, token hiç client'a inmez.

---

## 5. Next.js 16 Kırıcı Değişiklik: Middleware → Proxy

`web/AGENTS.md` uyardı: "Bu bildiğin Next.js değil, kod yazmadan docs'u oku." Heedettim → `node_modules/next/dist/docs`'ta gördüm: **Next 16'da Middleware artık "Proxy"** (dosya `middleware.ts` değil `proxy.ts`, fonksiyon `proxy`). İşlev aynı. İlk yazdığım `middleware.ts`'i `proxy.ts`'e taşıdım; build "Proxy (Middleware)" diye tanıdı.

> [!important] Yeni sürüm = varsayımları doğrula Eğitim verisi bir sürümde donmuş olabilir. Tool/framework yeni major sürümdeyse (Next 16) API adlarını/konvansiyonları yereldeki docs'tan teyit et — middleware→proxy gibi yeniden adlandırmalar sessizce build'i kırar.

> [!question] Mülakat Sorusu **"Bildiğinden daha yeni bir framework sürümüyle çalışırken ne yaparsın?"** Cevap: Hafızama güvenmem; o sürümün yerel dokümanını/changelog'unu okurum. Major sürümlerde yeniden adlandırma, kaldırma, async'e çevirme (ör. cookies()/params artık Promise) sık. Önce kırıcı değişiklikleri tarar, sonra yazarım.

---

## 6. Server-Component-Öncelikli Okuma: Link Tabanlı Navigasyon

Okuma diliminde neredeyse hiç client JS yok. Çizelge bir **server component**: şubeleri + seçili haftanın vardiyalarını sunucuda çeker, grid'i render eder. Şube seçimi ve hafta gezinme **`<Link>`** (searchParams: `?branchId=&week=`) — tıklayınca URL değişir, sunucu yeniden render eder. Sürükle-bırak (client etkileşimi) **2. adım**.

Tarih tuzağı: backend saatleri "duvar saati" gibi UTC saklıyor. TZ kaymasını önlemek için saat/günü ISO string'den DOĞRUDAN okuduk (`T(\d\d):(\d\d)` regex, `iso.slice(0,10)`) — `new Date()` yerel TZ yorumuyla grid'i kaydırmasın.

> [!question] Mülakat Sorusu **"Salt-okuma bir liste/takvim ekranında ne kadar client JS gerekir?"** Cevap: Çoğu zaman hiç — server component veriyi çekip render eder, filtre/sayfalama URL (searchParams) + `<Link>` ile sunucu tarafında döner. Client JS'i yalnız gerçek etkileşim (sürükle-bırak, optimistic update) gerektirince eklerim. Az JS = hızlı, basit, SEO/erişilebilirlik dostu.

---

## 7. Uçtan Uca Doğrulama (curl)

API zaten :5203'te çalışıyordu; Next dev :3000'de. Kanıtlar:
1. **BFF login** → `{ok:true}` + `Set-Cookie shift_token (HttpOnly)`, token gövdede yok. ✓
2. **`/schedule` cookie ile** → HTTP 200, "Vardiya Çizelgesi" + "Berke Biçer" (/me) + hafta/şube nav render. ✓
3. **cookiesiz `/schedule`** → 307 → `/login` (proxy koruması). ✓
4. **2026-06-15 haftası** → 17 "Taslak" rozeti + Pzt/Sal/Çar gün gruplaması (20 gerçek vardiya render). ✓

---

## 8. Durum (Gün 21 sonu)

**Proje:** `web/` (create-next-app: Next 16 + TS + Tailwind v4 + App Router, repo içi).

**Yeni dosyalar:**
- `lib/types.ts` (DTO'lar), `lib/session.ts` (httpOnly cookie), `lib/api-server.ts` (Bearer'lı server fetch + ApiError), `lib/date.ts` (hafta/duvar-saati)
- `app/api/auth/login/route.ts` + `logout/route.ts` (BFF), `proxy.ts` (rota koruması)
- `app/(auth)/login/page.tsx` (client form), `app/(app)/layout.tsx` (üst bar + /me), `components/LogoutButton.tsx`
- `app/(app)/schedule/page.tsx` (server: şube+hafta+grid), `components/schedule/ScheduleGrid.tsx` + `ShiftCard.tsx`
- `.env.local` / `.env.example` (API_BASE_URL)

**Build:** `next build` temiz (TS geçti, Proxy tanındı).

---

## 9. Sırada Ne Var (Gün 22)

> [!note] Bu dilim okuma Çizelge salt-okuma. **Sürükle-bırak (vardiya taşıma/atama) 2. adım** — client etkileşimi + `PUT /api/shifts/{id}` (mevcut backend ucu) + optimistic update.

**Frontend yol haritası (dikey dilimlerle):**
- Çizelge sürükle-bırak + vardiya oluştur/düzenle/yayınla (mevcut backend uçları).
- Sonraki dilimler: Görev/Kanban panosu, kontrol listeleri, duyuru — hepsi mevcut API'yi tüketir.
- Personel PWA (sonra).

**Backend tarafı (demo sonrası, değişmedi):** Excel export, tatil takvimi, tekrarlayan görev, vardiya-kapatma guard'ı, R2 implementasyonu.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Dikey dilim: bir akışı uçtan uca bitir (yatay değil) — entegrasyonu öne çek
- [ ] Önce gerçek sözleşmeyi koddan oku (token alanı `token`, status int, ProblemDetails)
- [ ] BFF: frontend sunucusu proxy → CORS'u backend'e dokunmadan aş (server-to-server)
- [ ] httpOnly cookie: token tarayıcı JS'ine hiç verilmez (XSS'e kapalı); BFF yönetir
- [ ] Next 16: Middleware → Proxy (proxy.ts); yeni sürümde docs'u oku, varsayma
- [ ] Server-component-öncelikli okuma: searchParams + `<Link>`, client JS yok
- [ ] Duvar-saati: saat/günü ISO string'den doğrudan al (TZ kayması olmasın)
- [ ] Sürükle-bırak = sonraki adım (client etkileşimi + PUT + optimistic)

#shift #frontend #nextjs #typescript #tailwind #bff #httponly-cookie #vertical-slice #vardiya
