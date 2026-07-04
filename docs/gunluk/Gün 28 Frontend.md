# Shift — Gün 28: Mesai/Bordro Turu — Sahte Bordro'yu Sök, Gerçek Snapshot'a Bağla

> [!info] Bugünün hedefi Gemini'nin mock-modlu frontend'ini gerçek .NET backend'e bağlama maratonunun **Mesai/Bordro** (Overtime/Payroll) modülü. Önceki turların aksine bu modül **hiç bağlanmamıştı**: ekran random sahte veri üretiyordu. Disiplin aynı: her uç için curl → ekran gerçek mi çekiyor → mutasyon DB'ye yazıyor mu → sayfa yenilenince kalıcı mı (optimistic illüzyon değil). Özellikle üç riskli nokta kovalandı: (1) tolerans gerçekten hesaba yansıyor mu, (2) haftalık 45s → %50 zamlı OT İş Kanunu çekirdeği doğru mu, (3) CSV/snapshot gerçek mi donuyor mu.

**Tarih:** 28 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript, .NET 10 **Durum:** ✅ Gün 28 tamamlandı — settings/summary/records/close/unlock/CSV uçtan uca DB'den doğrulandı

---

## 1. Backend Zaten Sağlamdı — Önce Bunu Kanıtla

Mock'u söküp panik etmeden önce backend'i curl'ledim: tüm uçlar çalışıyor, İş Kanunu hesabı doğru. **Canlı kanıt** (psql ile gerçek clock kaydı kurup elle doğruladım): Burak'a tek ISO haftaya 5×10s = **50s** →
- `45 normal + 5 fazla mesai` (haftalık eşik, **aylık toplamdan değil**)
- **brüt 6825 = 45×130 + 5×130×1.5** ✓
- 21 birim test yeşil.

**Snapshot donuyor mu?** Kapanıştan sonra clock'u +2s uzattım → canlı summary **52s/7OT** oldu ama kilitli kayıt **50s/5OT'de dondu**. Kilitliyken close=**400**; unlock(204)→re-close(200) snapshot'ı tazeledi, unlock audit (UnlockedAt/By) DB'de kaldı.

> [!important] Mock'u sökmeden önce gerçeği doğrula Entegrasyonda ilk refleks "FE bozuk, düzelteyim" olur. Ama önce backend'in gerçekten doğru olduğunu kanıtlamazsan, yanlış zemine sağlam bina kurarsın. Burada hesap motoru zaten doğruydu; iş tamamen FE'yi o doğru zemine **dürüstçe** bağlamaktı.

---

## 2. Mock'un En Büyük Yalanı: Random Bordro

`PayrollBoard.handleBulkClose` gerçek `closePeriod`'ı çağırıyordu ama sonucu **atıp** ekrana `Math.random()` ile sahte saat/brüt/prim basıyordu (rate 150/200, random OT). Daha kötüsü: payload `{periodStart, periodEnd}` + ISO datetime gönderiyordu; backend `{userId, from, to}` **DateOnly** bekliyor → bind olmuyor → **`0001-01-01` çöp kayıt** yazılıp **200** dönüyordu. Canlı tekrarladım, gördüm, temizledim.

Düzeltme: sahte üretim tamamen söküldü. Bulk close kilitsiz personel için gerçek `closePeriod({userId, from, to})` (date-only) çağırıp `router.refresh()` ile **DB'den geri okuyor**. Doğrulama: 7 personel kapatıldı, hepsi gerçek period `2026-06-01..30` (çöp yok), Burak 52s/7OT/7215₺ değişmedi.

> [!question] Mülakat Sorusu **"Mock'tan gerçeğe geçerken 200 dönen bir çağrı seni neden yanıltır?"** Cevap: Status code başarıyı değil, "isteğin işlendiğini" söyler. Burada close 200 dönüyordu ama yanlış payload yüzünden DB'ye `0001-01-01` çöp yazıyordu. Mutasyonu **DB'den geri okumadan** "çalışıyor" demek, en pahalı yeşil-yıkamadır.

---

## 3. Tolerans: Backend'de Karşılığı Olmayan Kozmetik Yalan → Söküldü

Settings formu "Erken Giriş / Geç Çıkış Toleransı (dk)" gösteriyordu. Kovaladım: `OvertimeSettings` entity'de, `UpdateCommand`'da, `Validator`'da, `OvertimeCalculator`'da **hiç yok**. FE bu alanları PUT gövdesinde yolluyordu, backend sessizce yutuyordu. Yani tolerans **hesaba yansımıyordu, sadece UI'da duruyordu** — kovaladığımız ilk şüphenin cevabı buydu.

Karar (kullanıcıyla): **UI'dan sök.** Toleransı backend'e eklemek göründüğünden ağır bir **İş Kanunu kararı** — gerçek çalışılan dakikayı silmek demek, "gerçek süre üzerinden hesap" çekirdeğimize ters. Time Clock turundaki kimlik-seçici sökme deseninin aynısı: yapamadığını yapıyormuş gibi gösteren kontrolü kaldır. Yerine forma gerçek `nightStart/nightEnd` (gece penceresi) input'ları kondu — bunlar backend'de **var** ve form bunları **hiç göndermiyordu** (validator 400). Artık ayar kaydı çalışıyor.

> [!important] "UI'da var" ≠ "hesapta var" Bir ayar kutusu çizmek, o ayarın bir şey yaptığını **garanti etmez**. Tolerans ekrandaydı ama bordroya sıfır etkisi vardı. Gerçek ayrımı backend entity + calculator belirler; gerisi görsel. Karşılığı olmayan kontrolü bırakmak, kullanıcıya "param yuvarlanıyor" yalanı söyler.

---

## 4. CSV: Client-Side Üretim Söküldü, Gerçek Export Ucuna Bağlandı

FE CSV'yi tarayıcıda (sahte/eşleşmeyen in-memory veriden) kuruyordu; backend'in `GET /records/export` ucu (InvariantCulture, BOM, sadece-kilitli, Logo/Mikro kolonları) **hiç kullanılmıyordu**. Düzeltme: `exportOvertimeCsv(from,to)` proxy üzerinden gerçek ucu çağırıp blob indiriyor. Tarayıcı oturumunda doğruladım: `text/csv`, ondalık **nokta** (45.00), tarih ISO, Burak satırı `45.00,7.00,52.00,...,7215.00` — donmuş snapshot'tan. Brüt hesabı tek kaynaktan (DB), iki yerde çürümez.

---

## 5. Liste Ucu Brüt Döndürmüyordu — Tek Onaylı Backend Dokunuşu

Bordro grid'inin işi kapanmış dönemleri **brüt'le** görmek. Ama `records` list ucu sadece saat döndürüyordu (para sadece detail+CSV'deydi). Calculator'a **dokunulmadı**; sadece `OvertimeRecordListItem` projeksiyonuna zaten donmuş snapshot alanları (rate/çarpan/prim/brüt/unlockedAt) eklendi — yeni hesap yok, salt-okuma genişletme. Grid artık Burak'ı **₺7.215,00 Kilitli** gösteriyor.

> [!question] Mülakat Sorusu **"Frontend bir alana ihtiyaç duyuyor ama liste ucu döndürmüyor — ne yaparsın?"** Cevap: Önce ayrımı netleştiririm: yeni **hesap/iş mantığı** mı gerekiyor (→ backend kararı, dur-sor), yoksa zaten DB'de **donmuş** bir değeri expose etmek mi (→ güvenli projeksiyon)? Burada ikincisiydi: brüt kapanışta zaten yazılmış, sadece liste DTO'su dar tutulmuştu. Migration/mantık olmadan tek satır genişletme — düşük risk, doğru çözüm.

---

## 6. /reports: userId'siz Çağrı 400 — Per-User Paralel Özet

`/reports` `getOvertimeSummary()`'yi **userId'siz** çağırıyordu; backend summary ucu tek personel hesaplar (userId zorunlu) → **400**, sayfa çöküyordu. Ayrıca shape uyuşmuyordu (FE `array + grandTotalHours`; backend `tek obje + totalHours`). Düzeltme: server bileşeni her personel için **paralel** summary çekiyor (Availability'deki N+1 deseni), board gerçek shape'e (`normalHours/overtimeHours/totalHours`) hizalandı. Burak canlı özet 45/7/52 ✓.

---

## 7. Durum (Gün 28 sonu)

**Değişen (FE):**
- `components/payroll/PayrollBoard.tsx` — sahte random söküldü; gerçek close (date-only `{userId,from,to}`); grid tarih eşleşmesi; `records` prop'tan (useState değil); gerçek CSV export; unlock optimistic-illüzyon yerine refresh.
- `components/reports/OvertimeSummaryBoard.tsx` + `app/(app)/reports/page.tsx` — per-user paralel summary + shape uyumu.
- `components/settings/OvertimeSettingsForm.tsx` — tolerans söküldü, nightStart/nightEnd eklendi.
- `lib/api-client.ts` — `closePeriod` payload düzeltildi + `{recordId}` döner; `exportOvertimeCsv` eklendi; `updateOvertimeSettings` payload (night + tolerans çıkarıldı).
- `lib/api-server.ts` — `getOvertimeSummary` tek obje + userId zorunlu.
- `lib/types.ts` — `OvertimeSettingsDto` (night/−tolerans), `OvertimeSummaryDto` (gerçek shape).

**Değişen (backend, tek onaylı projeksiyon):** `OvertimeRecordListItem` + handler — para alanları expose (calculator/migration YOK). **Build:** 0 tip hatası (tsc + dotnet); 21 overtime testi yeşil.

**Doğrulama (curl + proxy + tarayıcı):** summary/records list (brüt'le)/close (gerçek period)/bulk-close (7 kayıt, 0001 yok)/CSV (gerçek uç)/settings save (eskiden 400)/reports (eskiden 400) — hepsi DB'den teyitli, sayfa yenilenince kalıcı.

---

## 8. Biriken Eksik Listesi (etiketli — bu turda güncellendi)

| # | Eksik | Etiket | Not |
|---|-------|--------|-----|
| 1 | Shift Pool (ver/al) | **inşa** | Backend yok — en sonda kullanıcıyla tasarlanacak |
| 2 | PWA | **inşa** | Yok |
| 3 | Foto reload-persistence | **bug** | `TaskDto` attachment URL alanı yok |
| 4 | Availability tüm-ekip ucu | **temizlik** | Backend per-user; FE N+1 (bordro summary'de de aynı desen) |
| 5 | İzin geçmişi görünümü | **kapsam** | Yönetici geçmiş onay/red göremiyor |
| 6 | Kiosk PIN-identity | **kapsam** | `clock-in-by-pin` ucu gerekir |
| 7 | Geç-giriş bildirimi e2e | **doğrulama boşluğu** | Kod-teyitli; Published vardiya önkoşulu demo veride yok |
| 8 | **Mesai toleransı (erken-giriş/geç-çıkış dk)** | **kapsam (Faz 2+)** | **İş Kanunu kararı gerektirir** — gerçek çalışılan dk'yı yuvarlamak/silmek; çekirdek "gerçek süre üzerinden hesap"a ters, hafifçe eklenmez |
| 9 | Toplu kapanış ucu (`close-bulk`) | **temizlik** | FE şimdilik kişi-kişi döngü; tek transaction'lık uç performans/atomiklik için iyi olur |

---

## 9. Branch Durumu

- **Aktif dal:** `gemini/feature-workspace`.
- **Tamamlanan turlar:** Schedule ✅, Kanban ✅, Müsaitlik+İzin ✅, Time Clock ✅, **Mesai/Bordro ✅** — hepsi gerçek DB'den doğrulandı.
- **Sıradaki tur:** Checklist (şablon+çalıştırma) / Vardiya Notları / Duyuru+Bildirim. **En son (kullanıcıyla, inşa):** Shift Pool, PWA.
- **`main`'e merge:** turlar bitince.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Mock'u sökmeden önce backend'in doğruluğunu kanıtla (yanlış zemine bina kurma)
- [ ] 200 başarı değil "işlendi" demek — mutasyonu DB'den geri oku (0001 çöp kaydı 200 dönüyordu)
- [ ] "UI'da var" ≠ "hesapta var" — karşılığı olmayan kontrolü sök (tolerans = İş Kanunu kararı, kozmetik değil)
- [ ] Haftalık 45s eşik haftaya göre; aylık toplamdan çıkarmak yanlış (brüt 6825 elle doğrulandı)
- [ ] Snapshot kapanışta donar; unlock→re-close recalc; audit kalır
- [ ] FE'nin ihtiyacı "donmuş değeri expose" ise güvenli projeksiyon; "yeni hesap" ise backend kararı
- [ ] CSV tek kaynaktan (backend snapshot) — client-side üretim iki yerde çürür

#shift #frontend #nextjs #mesai #bordro #overtime #payroll #entegrasyon #gercek-backend #snapshot #is-kanunu #gap-list
