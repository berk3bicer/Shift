# Shift — Gün 26: Görev/Kanban Panosu (Paylaşılan Hook'u Yeniden Kullan + Kolon-Only)

> [!info] Bugünün hedefi İkinci dikey dilim: Kanban görev panosu. İki ön-koşulla: (1) optimistic+rollback çekirdeğini ÇİZELGEDEN kopyalamadan paylaşılan `useOptimisticList` hook'undan kullan; (2) Move sözleşmesini önce doğrula — backend status-only mu, sıralama da mı? Status-only çıktı → Kanban kolon-only (intra-column reorder yok, yeni backend ucu yok). Board + sürükle-taşı + görev oluştur.

**Tarih:** 26 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript **Durum:** ✅ Gün 26 tamamlandı — board/move/create uçtan uca doğrulandı

---

## 1. Paylaş, Kopyalama: Hook İkinci Tüketicide Karşılığını Verdi

Gün 25 sonunda optimistic+rollback mantığını `useOptimisticList` hook'una çıkarmıştık (çizelge için). Bugün Kanban onu **import etti** — tek satır:
```ts
const { items: tasks, setItems, feedback, pendingId, mutate } = useOptimisticList<TaskDto>(initialTasks);
```
Sürükle-taşı `mutate({ id, optimistic, run: () => moveTask(id, newStatus) })`. İkinci kopya YOK. Eğer çekirdeği kopyalasaydık, bir rollback bug'ını iki yerde avlardık. "Önce paylaş, sonra ikinci tüketici" disiplini tam burada ödedi: çizelgede çalışan rollback, Kanban'da bedavaya geldi.

> [!question] Mülakat Sorusu **"Aynı mantığı ikinci bir yerde kullanman gerekince ne yaparsın?"** Cevap: Kopyalamadan önce paylaşılabilir bir soyutlamaya (hook/util) çıkarırım — tercihen İKİNCİ kullanım gelmeden, ilk kullanımı refactor ederek. Kopya, divergence ve "iki yerde aynı bug" demektir. Refactor maliyeti ikinci tüketici eklenmeden ucuz, sonradan pahalıdır.

---

## 2. Sözleşmeyi Önce Doğrula: Status-Only → Kolon-Only

Kanban'ın kritik sorusu: kolon değişimi backend'de tek `status` alanı mı, yoksa pozisyon/sıralama da mı? Koddan bakıldı:
- `TaskItem`: `Status` (ToDo/InProgress/Done) — **SortOrder/Rank/Order YOK.**
- `POST /api/tasks/{id}/move` body `{ newStatus }` → status-only.

Sonuç: backend **hangi kolonda**'yı tutuyor, **kolon-içi sırayı tutmuyor.** İntra-column reorder istesem yeni alan (`SortOrder`) + migration + yeni hesap = **backend'e dokunmak** → DUR-ve-sor kuralı. Demo için reorder gereksiz ("hangi kolonda" yeter), o yüzden **kolon-only** yaptık, backend'e dokunmadık.

> [!important] Etkileşimi backend'in tuttuğu veriyle sınırla Frontend'de "sürükle-sırala" istemek cazip ama backend sıra tutmuyorsa bu yeni bir kalıcılık ihtiyacıdır. UI'ı backend'in modelleyebildiğiyle hizala; "güzel olurdu" diye sessizce yeni alan/uç gerektiren bir özelliğe girme — o ayrı bir karar (ve commit).

> [!question] Mülakat Sorusu **"Kanban'da kart sıralamasını nasıl kalıcılaştırırsın?"** Cevap: Status tek başına "hangi kolonda"yı verir; kolon-içi sıra için ayrı bir sıralama alanı (örn. fractional/float `sortOrder` ya da linked-list `prevId`) ve onu güncelleyen uç gerekir. Backend'de bu yoksa reorder eklemek yeni veri modeli + endpoint demektir — küçük görünüp aslında backend işidir; net karar gerektirir.

---

## 3. Move'un Warning'i Yok — Hook Yine Uyar

Çizelgede `updateShift` warnings döndürüyordu (45h limiti vb.). Görev `move` ise `MoveTaskResult(taskId, status)` — **warnings yok** (serbest hareket; tek guard aynı→aynı). Frontend bunu client-side eler (aynı kolona bırak = no-op, 400'e hiç girmez). Hook'un warning yolu Kanban'da tetiklenmez ama rollback yolu aynen geçerli (nadir 400 / ağ hatası → kart geri döner). Aynı hook iki farklı sözleşmeye (warnings'li / warnings'siz) uyum sağladı çünkü `run`'ın dönüşü opsiyonel.

---

## 4. Reproducible Demo: Görevler Seed'e Eklendi

Gün 23'teki "demo verisi gerçek API'den, idempotent" ilkesini koruyarak `scripts/seed-demo.mjs`'e Kanban görevleri eklendi: 5 görev (öncelik/kategori/atama çeşitli), başlığa göre idempotent, **hedef sütuna `move` ile dağıtılıyor** (2 Devam, 1 Tamamlandı, 2 Yapılacak). Re-run: `+0 eklendi` + sütunları hedefe normalize eder (tarayıcıda sürüklediğim kartı bile geri yerine koydu).

---

## 5. Test Notu: Sentetik DnD Zamanlaması

Sürükle-taşı'yı tarayıcıda doğrularken sentetik `dragstart→drop` ardışık dispatch'i ÇALIŞMADI: `onDragStart` React state'i (`draggingId`) async set ediyor, ardışık `drop` onu `null` okuyor → no-op. Gerçek sürüklemede gestler arası zaman var, state commit oluyor. `dragstart` sonrası 150ms bekleyince taşıma çalıştı (sayımlar `[2,2,1]→[1,2,2]`). Otomasyon kenar durumu — gerçek kullanıcı etkileşiminde sorun yok.

> [!question] Mülakat Sorusu **"Sürükle-bırak'ı otomatik test ederken neye dikkat edersin?"** Cevap: Native DnD gestleri zamanlamaya duyarlı — `dragstart` sonrası uygulama state'i güncellenmeden `drop` dispatch edersen mantık state'i boş okur. Gerçek kullanıcıda gestler arası doğal gecikme bunu maskeler; testte dragstart ile drop arasına bekleme koymak (ya da gerçek pointer simülasyonu) gerekir.

---

## 6. Durum (Gün 26 sonu)

**Yeni:** `components/tasks/{TaskBoard,TaskCard,TaskModal}.tsx`, `app/(app)/tasks/page.tsx`, `lib/taskMeta.ts`.
**Değişen:** `lib/types.ts` (TaskDto + enum'lar), `lib/api-server.ts` (getTasks), `lib/api-client.ts` (moveTask/createTask), `app/(app)/layout.tsx` (Çizelge/Görevler nav), `scripts/seed-demo.mjs` (görev seed).

**Backend:** dokunulmadı (kolon-only; yeni uç yok). **Build:** temiz.

**Doğrulama:** create (curl 5×200 + modal render), move (curl 200 + tarayıcıda gerçek sürükle Yapılacak→Tamamlandı), board render (3 kolon, öncelik renkleri/kategori/atanan), seed idempotent (+0/+0).

---

## 7. Sırada Ne Var (Gün 27)

Yeni dikey dilim: **kontrol listeleri** (şablon + çalıştırma, Modül 2.2), **duyuru** (fan-out), ya da çizelge **şablon/kopyala-yapıştır**. Görev modülünde defer kalanlar: görev sil/düzenle, tekrarlayan görev, fotoğraf ekleme (Attachment API hazır).

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] İkinci tüketici gelmeden çekirdeği paylaş (hook) — kopya = iki yerde bug
- [ ] Sözleşmeyi önce doğrula: backend status-only mu, sıra da mı tutuyor?
- [ ] Backend sıra tutmuyorsa reorder = yeni alan+uç = backend işi → DUR-ve-sor
- [ ] UI'ı backend'in modelleyebildiğiyle sınırla (kolon-only)
- [ ] Aynı hook warnings'li (vardiya) ve warnings'siz (görev) sözleşmeye uyar
- [ ] Demo verisi idempotent seed'e (görevler de) — hedef duruma normalize
- [ ] Sentetik DnD testinde dragstart→drop arası bekleme şart (state commit)

#shift #frontend #nextjs #kanban #shared-hook #optimistic #drag-drop #gorev
