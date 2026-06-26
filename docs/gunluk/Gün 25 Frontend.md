# Shift — Gün 25: Çizelgeyi Tamamla (Oluştur / Sil / Yayınla) + Proxy 204 Tuzağı

> [!info] Bugünün hedefi Yarım dilime yeni dilim eklemeden çizelgeyi BİTİRMEK. İki parça: (1) vardiya oluştur (gün "+" → modal) / sil (kart pop-over, onaylı, HARD), (2) Haftayı Yayınla (toplu publish-week, kişi başı tek bildirim). Hepsi mevcut API uçlarından — yeni backend ucu yok. Yol boyu BFF proxy'nin 204'ü yanlış işlediğini bulup düzelttik.

**Tarih:** 26 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript **Durum:** ✅ Gün 25 tamamlandı — oluştur/ata/sürükle/sil/yayınla uçtan uca doğrulandı

---

## 1. Yarımı Bitir, Sonra Genişle

Berke'nin kuralı: "yarım dilime başka dilim eklemeden bunu bitiriyoruz." Çizelge dikey dilimi okuma → sürükle → atama ile ilerlemişti; tamamlanması için CRUD'un kalanı (oluştur/sil) + yaşam döngüsünün sonu (yayınla) gerekiyordu. Yeni modüle (Kanban vb.) geçmeden önce bu akışı bitirdik — yarım bırakılan dilimler birikince hiçbiri demoya hazır olmaz.

> [!question] Mülakat Sorusu **"Yeni özelliğe mi geçersin, mevcut yarım özelliği mi bitirirsin?"** Cevap: Önce mevcut dilimi bitiririm. Yarım kalan akışlar "tamamlanmış görünüp aslında kullanılamayan" bir ürün biriktirir; her biri ayrı bağlam yükü. Bir dilimi uçtan uca (oluştur→düzenle→yayınla) kapatmak demoya/teste hazır somut değer üretir.

---

## 2. Sözleşmeyi Oku, Uydurma: Publish Toplu, DELETE Hard

Kod yazmadan backend okundu:
- **Publish iki türlü var:** tekil `POST /api/shifts/{id}/publish` ve toplu `POST /api/shifts/publish-week`. Spec'in "haftalık program yayınlanınca tüm personele bildirim" akışıyla örtüşen **toplu**yu seçtik — haftadaki tüm Draft'ları Published yapar, **kişi başına TEK özet bildirim** (distinct; her vardiya için ayrı değil → spam yok).
- **DELETE hard:** `DeleteShiftHandler` `Remove` ediyor (soft değil) → geri alınamaz → UI'da `confirm` zorunlu.
- **Create** çakışmada 400, başarıda `{ shiftId, warnings[] }`.

Bunları varsaymak yerine koddan çıkardık → frontend gerçek davranışa göre yazıldı (uydurma uç yok).

> [!important] Hard delete = onay zorunlu Geri alınamaz bir işlemi optimistic/sessiz yapma. DELETE soft olsaydı (IsActive) geri alınabilirdi; hard olduğu için kullanıcıya "kalıcı, emin misiniz?" sormak şart. Davranışı koddan teyit etmek (soft mu hard mı) UX kararını belirledi.

---

## 3. BFF Proxy Tuzağı: 204 Gövde Taşıyamaz

DELETE ilk denemede **500** döndü — ama backend doğru çalışıyordu (`DELETE FROM Shifts` SQL'i koştu, 204 NoContent döndü). Sorun proxy'deydi: upstream gövdesini `await upstream.text()` (boş string "") ile alıp `new NextResponse("", { status: 204 })` kuruyordu. **HTTP 204/304 gövde TAŞIYAMAZ** — Response ctor boş-string gövdeyle 204'te patlıyor → proxy 500 üretiyor.

Düzeltme: gövde boşsa `null` ver.
```ts
const text = await upstream.text();
return new NextResponse(text === "" ? null : text, { status: upstream.status, ... });
```

Genel bir proxy yazarken her status'ü düşünmek gerekir — sadece JSON dönen 200'leri değil, gövdesiz 204'leri de.

> [!question] Mülakat Sorusu **"Generic bir HTTP proxy yazarken hangi kenar durumları atlanır?"** Cevap: Gövdesiz yanıtlar (204/304) — body kopyalamaya çalışınca Response/Fetch katmanı patlar. Ayrıca: streaming gövdeler, content-type korunması, Set-Cookie sızdırmama, HEAD istekleri, hata gövdelerini olduğu gibi iletme. "Hep JSON döner" varsayımı 204'te kırılır.

---

## 4. Optimistic mi Pessimistic mi: Etkileşimin Doğasına Göre

Aynı board'da iki strateji:
- **Doğrudan manipülasyon (sürükle, atama):** OPTIMISTIC — kart anında hareket eder, hata olursa geri alınır. Kullanıcı fiziksel hareket yapıyor, anlık tepki bekler.
- **Buton/modal aksiyonları (oluştur, sil, yayınla):** PESSIMISTIC — önce API, sonra state. Kısa bir bekleme (spinner/disabled) doğal; optimistic karmaşıklığına (rollback) gerek yok, ve oluştur/sil'de "gerçekten oldu mu?" netliği önemli.

İkisini ayırmak gereksiz karmaşıklığı önler: her şeyi optimistic yapmak modal'da rollback yükü getirir; her şeyi pessimistic yapmak sürüklemeyi yavaş hissettirir.

> [!question] Mülakat Sorusu **"Hangi aksiyonları optimistic, hangilerini pessimistic yaparsın?"** Cevap: Doğrudan manipülasyon (sürükle-bırak, toggle) optimistic — anlık his kritik, geri alma kolay. Sonuç önemli/yıkıcı veya doğal bir bekleme penceresi olan aksiyonlar (oluştur, sil, ödeme, yayınla) pessimistic — kullanıcı "oldu mu?" netliği ister, rollback karmaşıklığından kaçınılır.

---

## 5. Yayınla = Gün 8 Bildirim Fan-out'unu Tetikle

"Haftayı Yayınla" yeni bildirim kodu YAZMADI — `publish-week` ucu Gün 8'de kurulan Notification fan-out'unu zaten yapıyor (her etkilenen personele tek özet bildirim). Frontend sadece ucu çağırdı, sonuç toast'landı: **"28 vardiya yayınlandı, 6 kişiye bildirim gönderildi."** (28 vardiya, 6 atanmış kişi distinct; açık vardiyalar kişisiz → bildirim yok). Backend'in mevcut yeteneği UI'dan görünür oldu.

---

## 6. Uçtan Uca Doğrulama

**curl (BFF proxy):** create açık vardiya → 200 `{shiftId,warnings}`; delete → 204 (proxy fix sonrası). **Tarayıcı:** oluştur modal'ı (pozisyon/saat/kişi) render; "Haftayı Yayınla" → yeşil toast "28 vardiya / 6 kişi", tüm Taslak rozetleri kalktı, buton pasifleşti. (Demo'da canlı gösterilebilsin diye seed haftası psql ile Taslak'a geri alındı — tek alan.)

---

## 7. Durum (Gün 25 sonu)

**Yeni:** `components/schedule/ShiftModal.tsx` (oluştur modal). **Değişen:** `ScheduleBoard.tsx` (oluştur/sil/yayınla + pop-over'a Sil), `lib/api-client.ts` (createShift/deleteShift/publishWeek), `lib/api-server.ts` + `lib/types.ts` (getPositions/PositionDto), `app/(app)/schedule/page.tsx` (positions+branchId), `app/api/proxy/[...path]/route.ts` (**204 fix**).

**Backend:** dokunulmadı (yeni uç yok — kısıt korundu). **Build:** temiz.

**Çizelge dikey dilimi TAMAM:** oku → sürükle(gün-taşıma) → tıkla(kişi-atama) → oluştur → sil → yayınla. Throw→geri-al / warning→tut ayrımı korunarak, hepsi gerçek API'den.

---

## 8. Sırada Ne Var (Gün 26)

Çizelge bitti → yeni dikey dilim: **Görev/Kanban panosu** (mevcut Tasks API), **kontrol listeleri**, **duyuru**, ya da vardiya **şablon/kopyala-yapıştır**. Personel PWA sonra.

**Backend (demo sonrası, değişmedi):** Excel export, tatil takvimi, tekrarlayan görev, R2; Barista renk/ücret kozmetik düzeltmesi.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Yarım dilimi bitir, sonra yeni dilime geç (yarımlar birikmesin)
- [ ] Sözleşmeyi koddan oku: publish tekil/toplu?, DELETE soft/hard? → UX'i belirler
- [ ] Hard delete = `confirm` zorunlu (geri alınamaz)
- [ ] Generic proxy: 204/304 gövde taşıyamaz → boş gövde null olmalı (yoksa 500)
- [ ] Doğrudan manipülasyon optimistic, buton/modal aksiyonları pessimistic
- [ ] Toplu yayın mevcut Notification fan-out'unu tetikler (yeni kod yok)
- [ ] Yeni backend ucu eklemeden mevcut uçlarla tam CRUD+lifecycle kuruldu

#shift #frontend #nextjs #crud #publish #bff-proxy #optimistic-pessimistic #vardiya
