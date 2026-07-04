# Shift — Gün 29: Kontrol Listeleri Turu — "Bağlı Görünen" Mock-Şekli Gerçek Sözleşmeye Hizala

> [!info] Bugünün hedefi Entegrasyon maratonunun **Checklist** (Kontrol Listeleri) modülü. Mesai/Bordro "hiç bağlı değildi" (random sahte veri); Checklist ise daha sinsi bir halde: **gerçek API'leri çağırıyor ama tüm tipleri/alanları Gemini'nin mock'una göre yazılmış** — backend'in gerçek DTO'suyla uyuşmuyor. "Bağlı görünüyor, derleme geçiyor" ama çalışınca alanlar undefined, liste item'sız geliyor, create 400 dönüyor. Disiplin aynı: backend curl → ekran gerçek mi → mutasyon DB'ye yazıyor mu → reload'da kalıcı mı.

**Tarih:** 29 Haziran 2026 **Stack:** Next.js 16, React 19, TypeScript, .NET 10 **Durum:** ✅ Gün 29 tamamlandı — şablon CRUD + run start/check/auto-complete + foto kanıt uçtan uca DB'den doğrulandı

---

## 1. "Bağlı Değil" Değil, "Yanlış Şekle Bağlı" — Daha Sinsi Sınıf

Mesai/Bordro'da ekran `Math.random()` basıyordu (besbelli sahte). Checklist gerçek `startChecklistRun`/`checkChecklistItem`/`createChecklist` çağırıyordu — ama FE tipleri backend DTO'su DEĞİL, mock şekliydi. Bu yüzden derleme yeşil, sayfa "çalışıyor gibi" ama:
- Liste ucu `ChecklistRunSummaryDto` (madde YOK) döner; FE `run.items.map()` render eder → **bir run olunca `TypeError`** (ekran çöker). Maddeler ayrı `GET /{runId}` detayında.
- Alan adları kaymış: `startedByUserFullName`↔`startedByUserName`, `checkedByUserFullName`↔`checkedByUserName`, `orderIndex`↔`sortOrder` → hepsi sessizce `undefined`.
- `createChecklist` `items:[{text,orderIndex}]` yolluyor; backend `string[]` bekliyor → **400** ("could not be converted to String").
- `startedAt` FE tipinde var ama backend hiçbir DTO'da döndürmüyor → başlıkta "Invalid Date".
- Liste `?runDate=` yolluyor; backend `fromDate/toDate` bekliyor → tarih filtresi **yok sayılıyor** (tüm günler gelir).
- Mock kalıntısı: sabit `"Ahmet Yılmaz"`/`"s1"` optimistic run, `NEXT_PUBLIC_USE_MOCK` gating, `useState(initialRuns)` bayatlaması.

> [!important] "Derleniyor + API çağırıyor" = "bağlı" değildir `apiFetch<T>` dönen JSON'u T'ye **cast** eder, doğrulamaz. Tipler mock'a göre yazılmışsa TS mutludur ama runtime'da alanlar undefined gelir. Gerçek bağ = her alanı backend DTO'suyla eşle + mutasyonu DB'den geri oku. "Yeşil derleme" en kolay yanıltan illüzyondur.

> [!question] Mülakat Sorusu **"Liste ucu özet, detay ucu tam veri dönüyor; frontend listede tam veriyi varsayıyor — nasıl çözersin?"** Cevap: API tasarımı doğru (liste hafif, detay ağır). FE'yi mimariye uydururum: listeyi özet çek, sonra ekranda madde gerekiyorsa her özet için detayı çek (bounded N+1) — backend'i "listeye de item koy" diye şişirmem. Liste/detay ayrımı kasıtlıdır; tüketici ona göre iki adımda okur.

---

## 2. DUR-ve-Sor: İki Backend Kararı (timestamp + attachment)

İki kusur backend dokunuşu gerektiriyordu; kullanıcıya sordum, ön-koşulu doğrulayıp ilerledim:

**(D) `startedAt`** — Run başlığında başlama saati. `BaseEntity.CreatedAt` zaten var (start'ta damgalanıyor) → `ChecklistRunDto`'ya `StartedAt = CreatedAt` salt-okuma projeksiyon. **Migration yok.** Bordro brüt projeksiyonuyla aynı desen.

**(E) Foto kalıcılık (gap #3)** — Foto upload Attachment'ı yazıyordu ama run item DTO'da URL yoktu + FE geri okumuyordu → foto sadece o oturumda (objectURL), reload'da kayıp. Karar: run item DTO'ya `attachments[]` ekle. Ön-koşul: Attachment↔item **sert FK yok** (tasarımca polimorfik `OwnerType+OwnerId`) — ama `attachments[]`'i doldurmak **migration GEREKTİRMİYOR**: mevcut Attachments tablosunu `ListAttachmentsHandler`'ın bizzat kullandığı sorguyla (OwnerType=ChecklistRunItem + OwnerId ∈ madde id'leri, tek IN sorgusu) okuyup presigned URL üretiyoruz. **N+1 geri-okuma çözüm değil** (kullanıcı şartı) → handler tek sorguda topluyor.

> [!important] Polimorfik sahip ≠ "bağ yok" Attachment sahibe sert FK tutmaz (tek FK ile iki tabloya işaret edemezsin) ama bağ `OwnerType+OwnerId` ile *vardır* ve sorgulanabilir. "FK yok → yapılamaz" yanlış; doğru soru "migration gerekir mi?". Gerekmiyordu → DTO'yu sorguyla zenginleştirmek güvenli, şema değişmedi.

---

## 3. Madde Check = Otomatik "Kim + Ne Zaman" + Otomatik Tamamlanma

Check route'u `POST /checklistruns/{runId}/items/{itemId}/check` (Adım B'de `check-item`'dan düzeltilmişti) — FE'nin gerçekten bunu çağırdığını doğruladım. İşaretleme token'dan `CheckedByUserId/At` damgalıyor; tüm maddeler işaretlenince run **otomatik** `CompletedAt/By` alıyor, bir madde geri sökülünce tamamlanma geri alınıyor (Kanban Done-reopen simetrisi). Canlı: 3 madde işaretlendi → "Berke Biçer onayladı • 15:12" + run "Tamamlandı" (completedBy DB'de), reload'da kalıcı.

---

## 4. Foto Kanıt: Presigned Akış + Reload'da Kalıcı (gap #3 KAPANDI)

Tarayıcı oturumunda gerçek akışı sürdüm: `upload-url` → (proxy üzerinden) `PUT` → `confirm` → Attachment DB'ye yazıldı. **Sayfayı tam yeniledim**, foto `attachments[].downloadUrl` (presigned) ile geri geldi — artık sadece o oturumda değil, kalıcı. Gap listesindeki "foto reload-persistence (bug)" Checklist için kapandı (aynı kök neden Task'ta da var; o ayrı kova).

> [!question] Mülakat Sorusu **"Optimistic foto önizleme ile kalıcı foto arasındaki farkı nasıl yönetirsin?"** Cevap: Upload anında `URL.createObjectURL` ile anlık önizleme gösteririm (snappy), ama bu sadece o sekmede yaşar. Gerçek kalıcılık için upload backend'e yazıldıktan sonra `router.refresh` ile DTO'daki presigned `downloadUrl`'i geri okurum. Optimistic = UX; kalıcı kaynak = DB'den dönen URL. İkisini karıştırıp objectURL'i "kaydedildi" sanmak reload'da foto kaybettirir.

---

## 5. Durum (Gün 29 sonu)

**Değişen (backend, 2 onaylı salt-okuma projeksiyon — migration YOK):**
- `ChecklistRuns/Get/GetChecklistRunQuery.cs` — `ChecklistRunDto`'ya `StartedAt`; `ChecklistRunItemDto`'ya `Attachments[]` + `ChecklistItemAttachmentDto`.
- `ChecklistRuns/Get/GetChecklistRunHandler.cs` — StartedAt=CreatedAt; maddelerin attachment'larını tek IN sorgusuyla çekip presigned URL üretip DTO'ya gömme (IFileStorage enjekte).

**Değişen (FE):**
- `lib/types.ts` — Checklist tipleri backend DTO'suna hizalandı (sortOrder, *UserName, startedAt, attachments, yeni `ChecklistRunSummaryDto`).
- `lib/api-server.ts` — `getChecklistRuns` `fromDate/toDate` (runDate yok sayılıyordu) + summary tipi; `getChecklistRun` eklendi.
- `lib/api-client.ts` — `createChecklist`/`updateChecklist` `items: string[]`.
- `app/(app)/checklists/page.tsx` — özet listele → her run için detay çek (bounded N+1).
- `components/checklists/ChecklistsBoard.tsx` — mock kalıntısı söküldü (sabit isim/USE_MOCK), prop→state resync (`useEffect`), gerçek alanlar, foto `attachments[]` render.

**Build:** tsc 0 hata, dotnet 0 hata, 10 checklist testi yeşil, 0 console hatası.

**Doğrulama (curl + proxy + tarayıcı, DB'den):** şablon oluştur (eskiden 400) ✅ / güncelle (ad değişti, DB'de) ✅ / sil (soft-disable, IsActive=false, run snapshot durur) ✅ / run başlat (FE'den) ✅ / madde check (kim+saat DB'de) ✅ / otomatik tamamlanma (completedBy DB'de) ✅ / foto upload→reload kalıcı ✅.

---

## 6. Biriken Eksik Listesi (etiketli — bu turda güncellendi)

| # | Eksik | Etiket | Not |
|---|-------|--------|-----|
| 1 | Shift Pool (ver/al) | **inşa** | Backend yok — en sonda kullanıcıyla |
| 2 | PWA | **inşa** | Yok |
| 3 | ~~Foto reload-persistence (checklist)~~ | ~~bug~~ | ✅ **KAPANDI** (Gün 29) — attachments[] DTO'da. Task tarafı hâlâ açık (ayrı kova) |
| 3b | Task foto reload-persistence | **bug** | Aynı kök neden; TaskDto'ya attachments[] aynı desenle eklenebilir |
| 4 | Availability tüm-ekip ucu | **temizlik** | N+1 (checklist detayında da aynı bounded N+1 deseni) |
| 5 | İzin geçmişi görünümü | **kapsam** | Yönetici geçmiş onay/red göremiyor |
| 6 | Kiosk PIN-identity | **kapsam** | `clock-in-by-pin` ucu gerekir |
| 7 | Geç-giriş bildirimi e2e | **doğrulama boşluğu** | Published vardiya önkoşulu demo veride yok |
| 8 | Mesai toleransı | **kapsam (Faz 2+)** | İş Kanunu kararı |
| 9 | Toplu kapanış ucu (bordro) | **temizlik** | Kişi-kişi döngü çalışıyor |

---

## 7. Branch Durumu

- **Aktif dal:** `gemini/feature-workspace`.
- **Tamamlanan turlar:** Schedule ✅, Kanban ✅, Müsaitlik+İzin ✅, Time Clock ✅, Mesai/Bordro ✅, **Checklist ✅** — hepsi gerçek DB'den doğrulandı.
- **Sıradaki tur:** Vardiya Notları / Duyuru+Bildirim (doğrulama turları). **En son (kullanıcıyla, inşa):** Shift Pool, PWA.
- **`main`'e merge:** turlar bitince.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] "Derleniyor + API çağırıyor" ≠ bağlı; `apiFetch<T>` cast eder, doğrulamaz → alanları DTO'yla eşle
- [ ] Liste özet / detay ağır ayrımı kasıtlı; FE iki adımda okur (bounded N+1), backend'i şişirme
- [ ] Polimorfik sahip (OwnerType+OwnerId) "FK yok" demek; doğru soru "migration gerekir mi?"
- [ ] Salt-okuma projeksiyon (StartedAt, attachments[]) migration'sız güvenli zenginleştirme
- [ ] Optimistic foto önizleme (objectURL) ≠ kalıcı; reload kaynağı DB'den presigned URL
- [ ] Check otomatik kim/ne zaman + tüm maddeler→otomatik tamamlanma (uncheck geri alır)
- [ ] `useState(prop)` bayatlar; router.refresh sonrası `useEffect`-resync ile DB gerçeğine dön

#shift #frontend #nextjs #checklist #kontrol-listesi #entegrasyon #gercek-backend #attachment #presigned #foto-kanit #gap-list
