# Shift — Gün 27: Giriş-Çıkış (Time Clock) Turu — Sahte Optimistic'i Sök, Dürüst Self-Clock + Gerçek Persistence

> [!info] Bugünün hedefi Gemini'nin mock-modlu frontend'ini gerçek .NET backend'e bağlama maratonunun **Time Clock** modülü. Modül-modül doğrulama disiplini: optimistic illüzyon değil, **DB'den geri okuyarak** kalıcılığı kanıtla. Bu turda özellikle üç riskli nokta kovalandı: (1) açık kayıt mantığı (çift clock-in engeli backend'de mi FE'de mi?), (2) QR/PIN/Kiosk üçlüsü gerçekten ayrı mı, `method` alanı gönderiliyor mu?, (3) geç giriş → yönetici bildirimi. **Yeni backend ucu eklenmedi.**

**Tarih:** 28 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript, .NET 10 **Durum:** ✅ Gün 27 tamamlandı — clock-in/out + method + açık-kayıt guard uçtan uca DB'den doğrulandı (commit `f614d3d`)

---

## 1. Mock'un En Büyük Yalanı: "Kimlik Seçici" ile Başkasını Damgalamak

Gemini'nin board'u bir **kimlik seçici** gösteriyordu ("Ayşe olarak giriş yap") — sanki yönetici tabletten herhangi bir personeli seçip damgalayabiliyormuş gibi. Ama backend `ClockInCommand`'ı **token kullanıcısını** damgalıyor; gövdede `userId` almıyor, alamaz. Yani seçiciden "Ayşe" seçip giriş yapsan bile DB'ye **oturum sahibi** (Berke) yazılırdı. UI gerçeği yanlış temsil ediyordu.

Düzeltme: seçici söküldü. Board artık **oturum sahibini** (token `meId`) dürüstçe damgalıyor. `page.tsx` `getMe()` ile `meId/meName` geçiyor; açık kayıt `clocks.find(c => c.userId === meId && c.checkOutTime === null)` ile oturum sahibine göre bulunuyor.

> [!important] Mock illüzyonunu gerçeğe hizalarken UI'ın iddiasını backend'in yapabildiğiyle eşitle Mock modda "güzel görünen" bir seçici, gerçek sözleşmede **veri bütünlüğü yalanı**na dönüşür: ekranda Ayşe, DB'de Berke. Entegrasyonda ilk iş, UI'ın söylediği şeyi backend'in gerçekten yapıp yapmadığını doğrulamak; yapamıyorsa o kontrolü sökmek (özelliği "yapıyormuş gibi" bırakmaktan iyidir).

> [!question] Mülakat Sorusu **"Mock backend'i gerçeğe bağlarken en sinsi bug sınıfı nedir?"** Cevap: Mock'ın kabul ettiği ama gerçeğin reddettiği/yok saydığı girdiler. Mock `userId`'yi onurlandırırken gerçek backend token'dan alıyorsa, UI yanlış aktöre işlem atfeder — derleme geçer, testler yeşil görünür, ama kalıcılaşan veri yanlıştır. Çare: her mutasyonu DB'den geri okuyup "kimin adına ne yazıldı"yı doğrulamak.

---

## 2. Açık Kayıt Mantığı: Guard Backend'de — FE Varsaymıyor

Soru netti: ikinci clock-in çift açık kayıt oluşturur mu, engelleyen kim? Curl-through-proxy ile kanıtlandı:
- 1. clock-in → **200**, `method:"QR"`, `checkOutTime:null` (açık kayıt).
- 2. clock-in (çıkış yapmadan) → **400** "Zaten açık bir giriş kaydınız var." — **backend enforce ediyor**, FE'nin iyimserliğine güvenmiyor.
- clock-out → kayıt kapanır, `workedMinutes` hesaplanır.

FE'de buton da disabled (`!!myOpenRecord`) ama bu sadece UX; **gerçek guard backend handler'ında** (open-record kontrolü, throw). İki katman: FE caydırır, backend reddeder.

> [!question] Mülakat Sorusu **"İş kuralını (çift açık kayıt yok) nerede zorlarsın — FE'de mi backend'de mi?"** Cevap: Her ikisinde ama otorite backend'de. FE'deki disabled buton sadece kullanıcıyı yanlış yola sokmamak için; gerçek bütünlük garantisi sunucuda (eşzamanlı istek, doğrudan API çağrısı, başka istemci hepsini FE atlar). FE guard'ı UX, backend guard'ı invariant.

---

## 3. QR/PIN: `method` Hiç Gönderilmiyordu — Şimdi Gidiyor

Backend `ClockMethod { QR=0, PIN=1 }`. **Kiosk ayrı bir method değil — PIN akışı** (sabit tablet). FE eski halinde `method`'u **hiç göndermiyordu**, hep default oluyordu. Düzeltme: `clockIn(branchId, method)` artık seçili yöntemi yolluyor; board'a QR (kendi telefonu) / PIN (paylaşılan tablet) toggle'ı eklendi. DB'ye `method:"QR"` yazıldığı doğrulandı; satırda rozet olarak gösteriliyor.

**Kapsam sınırı (dürüstçe işaretlendi):** "Sabit tablet, personel PIN'le **kendini tanıtır**, başkası adına damgalar" — gerçek Kiosk senaryosu — backend'de **`clock-in-by-pin` ucu yok**. Mevcut clock-in token-only olduğu için buradaki giriş her zaman oturum sahibi. Bu bir **kapsam borcu** (yeni uç gerekir), kozmetik değil; gap listesine öyle işlendi.

> [!important] "Üç farklı yöntem" görünüyor diye üçü ayrı çalışıyor sanma QR/PIN/Kiosk üç ayrı buton gibi durabilir ama backend modeli QR ve PIN'den ibaret; Kiosk PIN'in bir kullanım deseni. UI'da üç kutu çizmek, üçüncüsünün gerçek bir kimlik akışı olduğunu **garanti etmez**. Gerçek ayrımı backend enum + handler belirler; gerisi görsel.

---

## 4. Geç Giriş → Yönetici Bildirimi: Mekanizma Var, E2E Tetiklenmedi

Backend `ClockIn` handler'ı girişi **Published vardiyaya** göre kıyaslıyor (5 dk grace), geç ise `IsLate=true` işaretliyor ve `NotifyManagersAsync` ateşliyor (şube Manager'ları + tüm Owner'lar). Kod-teyitli. Ama e2e tetiklemek için giriş yapanın **o saatte Published vardiyası** olmalı; mevcut demo veride bu kombinasyon yok, o yüzden bildirim canlı düşmedi. Mekanizma sağlam, sahnesi eksik — bug değil, **doğrulama boşluğu**.

> [!question] Mülakat Sorusu **"Kod doğru ama e2e tetikleyemedin — nasıl raporlarsın?"** Cevap: "Çalışıyor" demem; "mekanizma kod-teyitli, şu önkoşul (Published vardiya) sağlanınca tetiklenir, demo veride o önkoşul yok" derim. Yeşil-yıkama (illüzyon) ile gerçek kanıt arasındaki farkı net tutarım; doğrulanmamışı doğrulanmış gibi sunmak en pahalı borçtur.

---

## 5. Time Clock = Mesai/Bordro'nun Hammaddesi

Bu tur ekstra önemliydi çünkü clock verisi (açık kayıt / `method` / timestamp doğruluğu) bir sonraki modülün — **Mesai/Bordro** — girdisi. Açık kayıt yanlışsa `workedMinutes` yanlış, dolayısıyla mesai/ücret yanlış. Bu yüzden timestamp ve açık-kayıt bütünlüğüne ekstra dikkat edildi; zemin sağlam oturdu, bordro turu sağlam veriyle başlayabilir.

---

## 6. Durum (Gün 27 sonu)

**Değişen:**
- `app/(app)/timeclock/page.tsx` — `getMe()` + `selectBranch()`; mock `branchId="b1"` hardcode söküldü; `meId/meName` geçiliyor.
- `components/timeclock/TimeClockBoard.tsx` — kimlik seçici söküldü; dürüst self-clock (token `meId`); QR/PIN method toggle; `clockIn(branchId, method)`; sahte optimistic yerine `router.refresh()` (DB'den tazele).
- `lib/api-client.ts` — `clockIn(branchId, method)` artık `method` gönderiyor.
- `lib/types.ts` — `TimeClockDto`'ya `method: string`.

**Backend:** dokunulmadı (token-only clock-in; yeni uç yok). **Build:** 0 tip hatası.

**Doğrulama (curl-through-proxy, cookie jar):** clock-in→200 (`method:"QR"` DB'de), 2. clock-in→400 (açık-kayıt guard backend'de), clock-out→kayıt kapandı + `workedMinutes`, `/mine` listesi token kullanıcısını süzüyor. Tüm kontroller geçti.

---

## 7. Biriken Eksik Listesi (etiketli — bu turda güncellendi)

| # | Eksik | Etiket | Not |
|---|-------|--------|-----|
| 1 | Shift Pool (ver/al) | **inşa** | Backend yok — en sonda kullanıcıyla birlikte tasarlanacak |
| 2 | PWA | **inşa** | Yok |
| 3 | Foto reload-persistence | **bug** | `TaskDto` attachment URL alanı yok; reload'da foto kayboluyor |
| 4 | Availability tüm-ekip ucu | **temizlik** | Backend list per-user; FE N+1 ile dolaşıyor (perf borcu) |
| 5 | İzin geçmişi görünümü | **kapsam** | Yönetici geçmiş onay/red'lerini göremiyor (küçük özellik, ayrı kova) |
| 6 | Kiosk PIN-identity (`clock-in-by-pin`) | **kapsam** | Gerçek "tablette PIN'le kendini tanıt" için yeni backend ucu gerekir |
| 7 | Geç-giriş bildirimi e2e | **doğrulama boşluğu** | Kod-teyitli; Published vardiya önkoşulu demo veride yok |

> [!note] Etiket disiplini "perf borcu" (Availability N+1) ile "fonksiyonel boşluk" (İzin geçmişi yok) aynı kovaya konmaz: biri hızı, diğeri eksik bir yeteneği anlatır. "bug" gerçek hata, "kapsam" tasarım kararı bekleyen özellik, "inşa" hiç yok, "doğrulama boşluğu" var-ama-kanıtlanmadı. Kovaları karıştırmak önceliklendirmeyi bozar.

---

## 8. Branch Durumu

- **Aktif dal:** `gemini/feature-workspace` (Gemini'nin mock-mode frontend'i; entegrasyon turları buraya işleniyor).
- **`main`'in önünde:** entegrasyon serisi (`7bc9c07` mock söküldü → … → `f614d3d` Time Clock turu) + Gemini'nin orijinal modül commit'leri.
- **Tamamlanan turlar:** Schedule ✅, Kanban (foto binary proxy dahil) ✅, Müsaitlik+İzin ✅, Time Clock ✅ — hepsi gerçek DB'den doğrulandı.
- **Sıradaki tur:** **Mesai/Bordro** (Overtime/Payroll) — settings/summary/records/dönem-kapatma/CSV, gerçek clock verisiyle İş Kanunu hesabı.
- **Sonra:** Checklist, Vardiya Notları, Duyuru+Bildirim. **En son (kullanıcıyla, inşa):** Shift Pool, PWA.
- **`main`'e merge:** turlar bitince; şimdilik dalda toplanıyor.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Mock'ın kabul ettiği girdi gerçeğin yok saydığıysa = veri bütünlüğü yalanı (ekranda Ayşe, DB'de Berke)
- [ ] Her mutasyonu DB'den geri oku — optimistic illüzyonu kanıt sayma
- [ ] İş kuralının otoritesi backend'de; FE disabled sadece UX
- [ ] "Üç buton" üç ayrı backend yeteneği demek değil (QR/PIN var, Kiosk = PIN deseni)
- [ ] Kod doğru ama e2e tetiklenmediyse "çalışıyor" deme — önkoşulu söyle
- [ ] Time Clock bütünlüğü = bordronun hammaddesi; timestamp/açık-kayıt kritik
- [ ] Gap etiketleri ayrı kova: bug / kapsam / temizlik / inşa / doğrulama boşluğu

#shift #frontend #nextjs #time-clock #entegrasyon #gercek-backend #self-clock #method #gap-list
