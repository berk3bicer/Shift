# Shift — Gün 24: Çizelge Kişi-Atama (Dropdown) — Rollback Disiplinini Yeniden Kullan

> [!info] Bugünün hedefi Çizelge dikey diliminin 3. adımı: bir vardiyanın **atanan kişisini değiştir** (karta tıkla → `GET /api/staff` dropdown'u → `PUT /api/shifts/{id}` UserId). Gün-taşımadaki optimistic+rollback mantığı AYNEN yeniden kullanıldı (tek `applyUpdate` çekirdeği). Açık vardiya (UserId=null) desteği dahil. **Yeni backend ucu eklenmedi** — `PUT /api/shifts` + `GET /api/staff` yetti.

**Tarih:** 26 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4 **Durum:** ✅ Gün 24 tamamlandı — atama 3 yol (çakışma/başarı/açık) curl + tarayıcı ile doğrulandı

---

## 1. Rollback Mantığını DRY Yap: Tek `applyUpdate`

Gün 22 (gün-taşıma) ve bugün (kişi-atama) AYNI optimistic+rollback ihtiyacını taşıyor: anında uygula, 400'de geri al, 200+uyarıda tut+toast. İki yere kopyalamak yerine tek çekirdeğe topladım:

```ts
async function applyUpdate(shift, patch, overrides) {
  const prev = shifts;
  setShifts(cur => cur.map(s => s.id===shift.id ? {...s, ...patch} : s)); // optimistic
  try {
    const { warnings } = await updateShift(shift, overrides);
    if (warnings.length) setFeedback({type:"warning", ...});               // 200: tut + bildir
  } catch (e) { setShifts(prev); setFeedback({type:"error", ...}); }        // 4xx: geri al
}
```

Gün-taşıma: `applyUpdate(s, {startTime,endTime}, {startTime,endTime})`. Atama: `applyUpdate(s, {userId,userFullName}, {userId})`. İki etkileşim, tek doğruluk kaynağı → rollback kuralı bir kez doğru yazıldı, her yerde aynı.

> [!important] Tekrarlanan kuralı çekirdeğe topla Optimistic+rollback gibi ince ve kolay-yanlış-yapılan mantık iki yere kopyalanınca biri eninde sonunda diğerinden ayrışır (biri rollback'i unutur). Tek fonksiyona toplamak hem DRY hem güvenlik: kural tek yerde yaşar, yeni etkileşim onu otomatik miras alır.

> [!question] Mülakat Sorusu **"İki farklı kullanıcı aksiyonu aynı optimistic+rollback davranışını paylaşıyorsa nasıl yapılandırırsın?"** Cevap: Ortak çekirdeği (snapshot → optimistic patch → API → başarıda uyarı / hatada rollback) tek bir fonksiyona alır, aksiyona özgü kısmı (hangi alan değişiyor) parametre olarak geçerim. Böylece rollback mantığı tek yerde; her yeni aksiyon onu yeniden yazmadan kullanır.

---

## 2. Genel `updateShift`: FULL PUT + Seçili Override (null dahil)

`PUT /api/shifts` full update ister. Tek genel fonksiyon: ShiftDto'nun tüm alanlarını gönder, `overrides`'taki alan(lar)ı değiştir.

```ts
userId: "userId" in overrides ? overrides.userId : shift.userId,
```

İncelik: **userId `null` OLABİLİR** (açık vardiya / atama kaldır). `?? ` kullanılsaydı null'ı "değişme" sanırdı; `"userId" in overrides` ile "açıkça null verildi" ile "verilmedi"yi ayırdık. JS'te null-vs-undefined ayrımının önemli olduğu klasik yer.

> [!question] Mülakat Sorusu **"Bir alanı null'a set etmekle 'değiştirme'yi nasıl ayırt edersin?"** Cevap: `??`/`||` null'ı da "yok" sayar; gerçek ayrım için anahtarın VARLIĞINA bakarım (`"key" in obj`). null geçerli bir değerse (atamayı kaldır), onu "değer verilmedi"den ayırmak için varlık kontrolü şart. Aksi halde "açık vardiya yap" isteği sessizce yutulur.

---

## 3. Tek Kart, İki Jest: Sürükle = Gün, Tıkla = Kişi

Aynı kart iki etkileşim taşır: **sürükle** → başka güne taşı; **tıkla** → "Kişi ata" dropdown'u aç. Native DnD'de tıklama (hareketsiz) `onClick`, sürükleme `dragstart/drop` üretir; tarayıcı drag sonrası click'i bastırır → çakışmazlar. Dropdown: staff listesi + **"Açık vardiya (atama yok)"** seçeneği (null'a set eder). Seçili değer = vardiyanın mevcut kişisi.

Açık vardiya iki yönlü: atanmamış vardiyayı kişiye ata (null→kişi) VEYA atamayı kaldır (kişi→null). Spec'teki "açık vardiya" kavramı tam karşılandı.

> [!tip] Çoklu jest aynı öğede Bir öğeye hem drag hem click bağlamak güvenli (native DnD click'i drag'den ayırır) ama jestleri kullanıcıya AÇIKÇA söyle (ipucu metni: "sürükle → taşı · tıkla → ata") — keşfedilebilirlik yoksa özellik görünmez kalır.

---

## 4. Kısıt Korundu: Yeni Backend Ucu Yok

Berke'nin kuralı: "yeni backend ucu ekleme — gerekirse DUR ve sor." Atama dilimi mevcut uçlarla tam karşılandı: `PUT /api/shifts/{id}` (UpdateShiftCommand zaten UserId nullable alıyor) + `GET /api/staff` (dün eklendi). Yeni uca gerek olmadı → durmaya gerek kalmadı. Çakışma/limit kuralları da backend'de hazırdı (aynı ShiftRuleChecker).

---

## 5. Uçtan Uca Doğrulama

**curl (BFF proxy, üç yol):**
- **A) Çakışma:** Ayşe'nin Pzt 08-16'sını Burak'a ata (Burak'ın Pzt 09-17'si var) → **400** "çakışma" → geri al.
- **B) Başarı:** Mehmet'in Pzt 15-23'ünü Can'a ata (Can Pzt boş) → **200** `warnings:[]` → tut.
- **C) Açık vardiya:** aynı vardiya → `userId:null` → **200** → atama kaldırıldı. (Sonra Mehmet'e iade edildi.)

**Tarayıcı:** karta tıkla → "Kişi ata" dropdown'u açıldı (8 seçenek: "Açık vardiya" + ekip), mevcut kişi seçili. `next build` temiz.

---

## 6. Durum (Gün 24 sonu)

**Değişen (yalnız frontend):**
- `lib/types.ts` — `StaffDto`; `lib/api-server.ts` — `getStaff()`
- `lib/api-client.ts` — `updateShiftDay` → genel `updateShift(shift, overrides)` (null userId)
- `components/schedule/ScheduleBoard.tsx` — `applyUpdate` çekirdeği + atama dropdown + açık vardiya
- `app/(app)/schedule/page.tsx` — staff'ı paralel çek (Promise.all), board'a geç; ipucu metni

**Backend:** DOKUNULMADI. **Build:** temiz.

---

## 7. Sırada Ne Var (Gün 25)

**Çizelge dilimi olgunlaştı:** okuma + gün-taşıma + kişi-atama + açık vardiya. Kalan çizelge işleri: vardiya **oluştur/sil** (boş güne tıkla → yeni vardiya modalı; `POST/DELETE /api/shifts`), **yayınla** (Taslak→Published; `POST /api/shifts/{id}/publish`).

**Diğer FE dilimleri:** Görev/Kanban panosu, kontrol listeleri, duyuru — hepsi mevcut API'yi tüketir. Personel PWA sonra.
**Backend (demo sonrası):** Excel, tatil takvimi, tekrarlayan görev, R2; Barista renk/ücret kozmetiği.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Optimistic+rollback'i tek çekirdeğe (applyUpdate) topla → DRY + tutarlılık
- [ ] Aynı kural iki aksiyonda: ortak çekirdek + aksiyona özgü override parametresi
- [ ] FULL PUT + seçili override; null geçerli değerse `"key" in obj` ile ayır
- [ ] Tek kart iki jest: sürükle=gün, tıkla=kişi (native DnD click'i drag'den ayırır)
- [ ] Açık vardiya (UserId=null) iki yönlü: ata + atamayı kaldır
- [ ] Kısıtı koru: yeni uç gerekmiyorsa ekleme; mevcut PUT + staff yeterli
- [ ] Jestleri kullanıcıya açıkça söyle (keşfedilebilirlik)

#shift #frontend #nextjs #optimistic-update #rollback #atama #vardiya
