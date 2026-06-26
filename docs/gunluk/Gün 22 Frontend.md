# Shift — Gün 22: Çizelge Sürükle-Bırak (Gün-Taşıma) — Optimistic + Rollback Disiplini

> [!info] Bugünün hedefi Çizelge dikey diliminin 2. adımı: vardiya kartını **başka güne sürükle-bırak** (tarih değişir, saat-of-day korunur → `PUT /api/shifts/{id}`). Asıl mesele optimistic update'in ZOR kısmı: backend kural sonucuna göre **çakışma(400)→geri al** vs **uyarı(200)→tut+toast** ayrımı. Kişiye-atama sonraki dilim. Backend'e dokunulmadı.

**Tarih:** 26 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4 **Durum:** ✅ Gün 22 tamamlandı — gün-taşıma uçtan uca doğrulandı (curl iki yol + tarayıcı)

---

## 1. Kapsamı Tek Cümlede Çiz: Gün-Taşıma, Atama Değil

"Sürükle-bırak" iki ayrı şey: (a) başka **güne** taşı (tarih değişir), (b) başka **kişiye** ata (UserId değişir). İlk dilimde (a) seçildi — daha basit, görsel tatmin yüksek, tek kişiyle test edilebilir. (b) birden fazla personel ister (demo verisi gelince). Kapsamı baştan daraltmak, "sürükle-bırak'ı yaptım ama yarısı çalışıyor" tuzağını önler.

> [!question] Mülakat Sorusu **"Belirsiz bir etkileşim isteğini (sürükle-bırak) nasıl dilimlere bölersin?"** Cevap: Aynı jest'in farklı sonuçlarını ayrı işler olarak görürüm (güne taşı ≠ kişiye ata). En basit + en değerliyi önce alır, kalanı sıraya koyarım. Hepsini tek seferde yapmaya çalışmak yarım-çalışan bir özellik üretir.

---

## 2. Optimistic Update'in Zor Kısmı: İki Ayrı Geri-Bildirim

Kart anında taşınır (optimistic), PUT arkada gider. Backend `ShiftRuleChecker` İKİ farklı şey yapar — frontend ikisini AYRI ele almalı:

| Backend | HTTP | Frontend |
|---|---|---|
| **Çakışma** (aynı kişi, aynı saat, başka vardiya) → `throw` | **400** | kartı **eski yerine geri al** + `detail` göster |
| 11s / 45s / dinlenme / müsaitsizlik → `warning` (engellemez) | **200** + `Warnings[]` | taşımayı **TUT** + uyarıyı toast'la |

```ts
const prev = shifts;                          // rollback snapshot
setShifts(move(id, delta));                   // optimistic
try {
  const { warnings } = await updateShiftDay(...);
  if (warnings.length) setFeedback({type:"warning", ...});   // 200: tut + bildir
} catch (e) {
  setShifts(prev);                            // 400: geri al
  setFeedback({type:"error", text:e.message});
}
```

**En kritik hata burada olurdu:** "herhangi bir kural sorunu = geri al" yazsaydık, 45h aşımı gibi GEÇERLİ bir taşımayı haksızca bozardık; "hiç geri alma" yazsaydık, çakışan taşımayı kullanıcı "oldu" sanırdı ama olmamış olurdu. Çakışma sert blok, limit yumuşak uyarı — ikisi ayrı.

> [!important] Optimistic UI = iyimser + dürüst İyimser göster (anında taşı) ama sunucu reddederse DÜRÜST ol (geri al + neden söyle). "Geri alma" yokken optimistic UI kullanıcıyı yanıltır. Rollback için önceki state'i sakla; başarı yolunda da sunucunun yumuşak uyarılarını yut etme, göster.

> [!question] Mülakat Sorusu **"Optimistic update'te sunucu hatası gelirse ne yaparsın?"** Cevap: Mutasyondan önceki state'i saklarım; hata gelirse o snapshot'a geri döner ve kullanıcıya nedenini gösteririm. Ayrıca "hata" ile "uyarı"yı ayırırım: hard fail geri alınır, non-blocking uyarı (işlem geçti ama dikkat) işlemi bozmadan bildirilir. Sessiz başarı varsayımı optimistic UI'ın en sık hatasıdır.

---

## 3. Genel BFF Proxy: Token'ı İlet, Asla Sızdırma

Client mutation'ları için genel proxy: `app/api/proxy/[...path]/route.ts`. Client same-origin buraya çağırır; proxy **cookie'deki token'ı sunucu tarafında okuyup** `Authorization: Bearer` ekler ve .NET'e iletir. Geriye yalnız backend gövdesi + status döner — **token/Set-Cookie ASLA client response'una kopyalanmaz** (httpOnly disiplini Dilim 1'deki gibi korundu).

Tüm metotlar (GET/POST/PUT/PATCH/DELETE) tek `forward` fonksiyonuna bağlı; gövdeli isteklerde body iletilir, content-type yansıtılır. Token sunucuda kalır, jest istemciden gelir.

> [!question] Mülakat Sorusu **"BFF proxy'de token sızıntısını nasıl önlersin?"** Cevap: Token yalnız sunucu tarafında (cookie'den okunup Authorization header'ına) kullanılır; proxy'nin client'a döndürdüğü yanıt sadece upstream gövdesi + status olur. Upstream'in Set-Cookie'sini, kendi cookie'mi veya token'ı response'a asla yazmam. httpOnly cookie + sunucu-only kullanım = token JS'e hiç inmez.

---

## 4. Native HTML5 DnD (Bağımlılık Riski Almadan)

Sürükle-bırak için kütüphane (@dnd-kit) yerine **native HTML5 DnD** seçildi: kart `draggable` + `onDragStart` (sürüklenen id), gün sütunu `onDragOver`(preventDefault) + `onDrop`. Neden: Next 16 / React 19 taze; dış DnD kütüphanesinin peer-dep/sürüm riski var. Native API mouse tabanlı sütun-taşımada yeterli, sıfır bağımlılık. (Dokunmatik/yeniden-sıralama gerekince @dnd-kit'e geçilir.)

Görsel geri-bildirim: sürüklenen kart yarı saydam, hedef sütun mavi ring, kaydedilirken `animate-pulse`.

---

## 5. FULL Update + Duvar-Saati Koruması

`PUT /api/shifts/{id}` **patch değil, full update** (`UpdateShiftCommand`: PositionId, UserId, StartTime, EndTime, Notes). ShiftDto tüm alanları taşıdığı için body yeniden kuruldu; gün-taşımada SADECE Start/End'in **tarih kısmı ±N gün** kaydı, saat-of-day aynen korundu (`shiftIsoByDays`: `"...T09:00:00Z"` → tarih değişir, `T09:00` sabit). Böylece "09:00 vardiyası" taşınınca yine 09:00 kalır.

Server→client sınırı: sayfa (server) veriyi çeker → `ScheduleBoard` (client) optimistic state'i sahiplenir. `key={branch-week}` ile hafta/şube değişince board state'i sıfırlanır (eski optimistic kalıntısı taşınmaz).

---

## 6. Uçtan Uca Doğrulama

**curl (BFF proxy üzerinden, iki yol):**
- **A) Çakışma:** 16→15 (mevcut 09:00 ile çakışır) → **HTTP 400** `"...zaten bir vardiyası var (çakışma)."` → frontend geri alır.
- **B) Başarı:** 16→21 (boş slot) → **HTTP 200** `warnings:["Haftalık 45 saat limiti aşılıyor... 56 saat..."]` → frontend tutar + toast'lar. (Test sonrası kayıt 16'ya geri alındı.)

**Tarayıcı (preview):** login → çizelge 2026-06-15 haftası render: üst bar (Berke Biçer/Owner), hafta nav, şube seçici, gün sütunlarında vardiya kartları (saat + kişi + Barista renk şeridi + Taslak). `next build` temiz.

> [!note] Demo verisi hatırlatması Ekran görüntüsünde seçili şube "Test Sube 2" — demo öncesi temizlenecek veri (5-6 personel + dolu hafta + gerçekçi şube adı). Kod değil, veri işi; gün-taşımayı bloklamadı.

---

## 7. Durum (Gün 22 sonu)

**Yeni:** `app/api/proxy/[...path]/route.ts` (genel BFF proxy), `lib/api-client.ts` (`updateShiftDay` + `ApiClientError`), `components/schedule/ScheduleBoard.tsx` (client DnD + optimistic + rollback + toast). `lib/date.ts` (`dayDeltaDays`, `shiftIsoByDays`).
**Değişen:** `app/(app)/schedule/page.tsx` (ScheduleBoard + key). **Silinen:** `ScheduleGrid.tsx` (board'a taşındı).

**Build:** temiz. **Doğrulama:** curl iki yol + tarayıcı render.

---

## 8. Sırada Ne Var (Gün 23)

> [!note] Kişiye-atama dilimi Sürükle-bırak'ın (b) ayağı: kartı başka kişiye sürükle (UserId değişir). **Birden fazla personel gerektirir** → önce demo verisi (5-6 personel + dolu hafta, psql seed) + "Test Sube 2" temizliği. Sonra atama UI.

**Diğer FE dilimleri:** vardiya oluştur/düzenle/yayınla modalı; Görev/Kanban panosu; kontrol listeleri; duyuru. Personel PWA sonra.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Sürükle-bırak'ı dilimle: güne-taşıma önce, kişiye-atama sonra
- [ ] Optimistic: anında göster + sunucu reddederse GERİ AL + nedeni söyle
- [ ] İki yol AYRI: çakışma(400)→rollback, limit warning(200)→tut+toast (karıştırma!)
- [ ] Rollback için önceki state snapshot'ını sakla
- [ ] BFF proxy: token cookie'den → Bearer (sunucuda); response'a/cookie'ye sızdırma
- [ ] Next16/React19'da native HTML5 DnD = sıfır bağımlılık riski
- [ ] PUT full update: ShiftDto'dan body kur, sadece tarih kaydır, saat-of-day koru
- [ ] Server fetch → client board optimistic state; key={branch-week} ile sıfırla

#shift #frontend #nextjs #optimistic-update #rollback #drag-drop #bff #vardiya
