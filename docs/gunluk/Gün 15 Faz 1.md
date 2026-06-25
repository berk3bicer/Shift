# Shift — Gün 15: Görev/Kanban Modülü (Yeni MVP Modülü, State Machine)

> [!info] Bugünün hedefi Spec Modül 2.1 "Kanban Görev Panosu"nu sıfırdan kurmak — taze bir MVP modülü, demo'nun ikinci ayağı. Üç sütunlu pano (Yapılacak → Devam Ediyor → Tamamlandı), görev CRUD, kişiye/pozisyona atama, öncelik, kategori, ve asıl iş: **durum geçişi state machine** (serbest hareket + Done yan etkileri). Vardiya (Shift) CRUD kalıbını birebir taklit ettik. Tekrarlayan görevler + fotoğraf ekleme bilinçli olarak ertelendi.

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 15 %100 tamamlandı — 65/65 test yeşil

---

## 1. İsimlendirme Tuzağı: `Task` Adını KULLANAMAYIZ

Modülün doğal entity adı "Task" ama bu .NET'te felaket: `System.Threading.Tasks.Task` ile çakışır — ve her async handler imzası zaten `Task<T>` döner. `TaskStatus` da BCL'de var (`System.Threading.Tasks.TaskStatus`). Çözüm, baştan çakışmayı kesen isimler:

- Entity: **`TaskItem`** (.NET dünyasında yerleşik kaçınma adı)
- Enum: **`TaskItemStatus`** (Status değil — TaskStatus çakışırdı)
- Feature klasörü: `Features/Tasks/` — bu güvenli, çünkü namespace segmenti, tip adı değil

> [!important] Tip adı ≠ namespace adı `Tasks` namespace'i sorun değil; `Task` *tipi* sorun. Bir tipi BCL'deki yaygın bir tiple aynı adlandırırsan, o tipin görünür olduğu her dosyada ya tam-nitelikli ad yazarsın ya da `using alias` koyarsın (kod tabanında `using ShiftEntity = ...Shift` zaten bunun örneği). En temizi: çakışmayan bir ad seç. Erken karar, sonradan yüzlerce `Task<T>` belirsizliğinden kurtarır.

> [!question] Mülakat Sorusu **"Domain kavramın dilin/standart kütüphanenin bir tipiyle aynı ada sahipse ne yaparsın?"** Cevap: Mümkünse çakışmayan bir entity adı seçerim (`TaskItem`, `WorkTask`). Çünkü çakışan ad, tipin göründüğü her yerde alias/tam-nitelik gerektirir ve `Task<T>` gibi her yerde geçen bir tiple çakışırsa kod okunaksızlaşır. Alias (`using X = ...`) son çare; isimlendirmeyi baştan doğru yapmak daha sürdürülebilir.

---

## 2. Kanban State Machine: "Serbest Hareket" Politikası

Üç durum: `TaskItemStatus { ToDo, InProgress, Done }`. Asıl tasarım kararı: **geçişler nasıl kısıtlanır?**

İki seçenek vardı:
- **Katı ileri akış:** ToDo→InProgress→Done zorunlu sıra; atlama/geri yok (reopen hariç).
- **Serbest hareket (Jira benzeri):** her sütun → her sütun; tek guard "aynı→aynı reddet".

**Karar: Serbest hareket.** Gerekçe: (1) spec "Jira benzeri" diyor — Jira kartı her sütuna sürüklenir; (2) kafe gerçeği: "masaları sil" görevini personel doğrudan Yapılacak'tan Tamamlandı'ya çeker (hızlı bitir); (3) yanlış tamamlananı geri açmak (Done→InProgress) doğal bir ihtiyaç.

Ama "serbest" demek "aptal alan" demek değil. State machine'in **değeri yan etkilerde**: durum değişimi salt bir int güncellemesi değil, zaman damgası + bildirim tetikler. İşte bu, onu gerçek bir state machine yapar.

```
        ┌──────────┐  start   ┌─────────────┐  complete ┌──────────┐
        │  ToDo    │ ───────► │ InProgress  │ ────────► │   Done   │
        └──────────┘ ◄─────── └─────────────┘ ◄──────── └──────────┘
             └────────── ToDo→Done (hızlı bitir, serbest) ──────►
             ◄──────────── Done→ToDo (geri aç, serbest) ─────────┘
```

> [!question] Mülakat Sorusu **"Serbest geçişli bir state machine ile kısıtlı bir state machine arasında nasıl seçim yaparsın?"** Cevap: Domain kuralı geçiş sırasını zorunlu kılıyor mu, ona bakarım. Para/onay akışı gibi yerlerde (taslak→onay→ödendi) atlamak tehlikelidir → kısıtla. UX'in sürükle-bırak özgürlüğü beklediği, yanlışı geri almanın masum olduğu yerlerde (Kanban) serbest bırakırım. Her iki durumda da değer geçişin *yan etkilerinde* (damga, bildirim, audit) — state machine'i salt alan güncellemesinden ayıran budur.

---

## 3. Geçiş Yan Etkileri: Done'a Giriş/Çıkış Simetrisi

`MoveTaskHandler` (Shift'teki `PublishShiftHandler` kalıbı) geçiş yaparken:

| Geçiş | Yan etki |
|-------|----------|
| → InProgress (ilk kez) | `StartedAt = now` (null ise; bir daha ezilmez) |
| → Done | `CompletedAt = now`, `CompletedByUserId = token`, **bildirim** (oluşturana) |
| Done'dan çıkış (reopen) | `CompletedAt = null`, `CompletedByUserId = null` |
| aynı → aynı | **reddet** ("zaten bu durumda") |

İki incelik:

**(a) Done giriş/çıkış simetrisi.** Done'a girince tamamlanma damgalanır; Done'dan çıkınca (reopen) **temizlenir**. Aksi halde geri açılmış bir görevde eski `CompletedAt` kalır → "bu görev hem açık hem tamamlanmış" tutarsızlığı. Bir duruma girerken set ettiğin alanı, o durumdan çıkarken geri al.

**(b) `StartedAt` bir kez damgalanır.** İlk InProgress girişinde set edilir, sonraki dönüşlerde (Done→InProgress reopen) **ezilmez** — "ilk ne zaman başlandı" sabit bir gerçek. `if (StartedAt is null)` guard'ı bunu korur. `CompletedAt` ise her Done girişinde tazelenir (en son ne zaman tamamlandı). İkisi farklı semantik: biri "ilk", öteki "son".

> [!important] "Kim?" bilgisi token'dan, client'tan değil `CompletedByUserId` ve `CreatedByUserId` `ICurrentUserProvider`'dan (JWT) gelir — istekteki bir alandan DEĞİL. Aksi halde personel "bu görevi falanca tamamladı" diye sahteleyebilir (IDOR). Kod tabanının her yerindeki kural: kimlik token'dan damgalanır.

> [!question] Mülakat Sorusu **"Bir duruma girişte alan set ediyorsun. Çıkışta ne yaparsın?"** Cevap: Simetriyi düşünürüm — girişte set ettiğim durum-bağımlı alanı çıkışta geri almam gerekir mi? Tamamlanma damgası gibi "şu durumdayken doğru olan" bir veri, durumdan çıkınca yanıltıcı/tutarsız olur. Giriş aksiyonu kadar çıkış aksiyonunu da tasarlamak state machine'in tutarlılığını korur.

---

## 4. Atama Modeli: Kişiye VEYA Pozisyona (XOR)

Spec: "Göreve atama: kişiye veya pozisyona ('tüm garsonlar')." İki nullable FK ile modelledik: `AssignedUserId?` ve `AssignedPositionId?`.

- İkisi de null → havuzdaki atanmamış görev (kim isterse alır).
- Biri dolu → ya kişiye ya pozisyona atanmış.
- **İkisi birden dolu OLAMAZ** → validator engeller ("ya kişiye ya pozisyona, ikisine birden değil").

Bu, bir tür "yumuşak XOR": en fazla biri set. Tek bir `AssignedToType + AssignedToId` (polimorfik) yerine iki ayrı FK seçtik çünkü her ikisi de gerçek FK (Users / Positions) — DB seviyesinde referans bütünlüğü + `SetNull` davranışı kazanırız. Polimorfik tek-kolon bunu veremezdi.

FK silme davranışı: atanan personel/pozisyon silinirse görev **SetNull** ile havuza döner (görev yaşar, atama kopar); şube silinirse **Restrict** (görev geçmişi uçmasın). Para/personel kalıbının aynısı.

> [!question] Mülakat Sorusu **"Bir alan 'A'ya ya da B'ye' işaret edebiliyorsa: iki nullable FK mi, tek polimorfik kolon mu?"** Cevap: İkisi de gerçek tablolarsa ve referans bütünlüğü/silme davranışı istiyorsam **iki ayrı nullable FK** (+ 'en fazla biri dolu' kuralı). DB FK garantisi ve SetNull/Restrict'i korur. Polimorfik tek kolon (Type+Id) esnektir ama FK veremez, bütünlüğü uygulamaya bırakır — yalnızca hedef tablolar çok ve dinamikse tercih edilir.

---

## 5. Sorumluluk Ayrımı: Update Durumu Değiştiremez

İki ayrı uç: `UpdateTask` (içerik + atama) ve `MoveTask` (durum). **Update, Status'a dokunmaz.** Neden ayırdık: durum geçişinin yan etkileri var (damga, bildirim); içerik düzenlemenin yok. İkisini tek "her şeyi güncelle" ucunda birleştirseydik, başlık düzeltmek isteyen biri yanlışlıkla durumu da gönderip bildirim tetikleyebilirdi. Ayrı uç = ayrı niyet = ayrı yan etki.

Bu, Gün 12-13'teki "CsvBuilder saf / handler kolonu bilir" ve Gün 11'deki kilit/unlock ayrımının aynı felsefesi: **farklı niyetleri farklı uçlara böl.**

> [!question] Mülakat Sorusu **"Durum değişimini neden ayrı bir endpoint'e koyarsın, genel update'e değil?"** Cevap: Durum geçişi genelde yan etki taşır (audit, bildirim, zaman damgası) ve guard'a tabidir; içerik düzenleme taşımaz. Aynı uçta birleştirmek, masum bir düzenlemenin yanlışlıkla geçiş yan etkilerini tetiklemesine yol açar. Ayrı uç hem niyeti netleştirir hem yetkilendirmeyi ayrı verir (personel durumu ilerletebilir ama içeriği düzenleyemez).

---

## 6. Yetkilendirme: Personel Kartı İlerletebilir

Controller rolleri: Create/Update/Delete/List → **Owner, Manager** (görev yönetimi). Ama `move` → **Owner, Manager, Staff**. Çünkü personel kendisine düşen görevi "Devam Ediyor"a/"Tamamlandı"ya çekebilmeli — Kanban'ın özü bu. Niyet ayrımı (madde 5) burada yetki ayrımına da dönüşüyor: personel durumu ilerletir ama görevin içeriğini/atamasını değiştiremez.

---

## 7. Mimari Kalıba Sadakat (Shift CRUD'u taklit)

Yeni modül ama hiçbir yeni desen icat etmedik — mevcut Vardiya (Shift) kalıbını kopyaladık:
- Feature-based klasör: `Features/Tasks/{Create,List,Update,Delete,Move}/` (Command/Query + Validator + Handler + Result).
- `IShiftDbContext` **hem** concrete **hem** interface'e `DbSet<TaskItem>` (CS1061 tuzağı — kılavuz uyarısı).
- FK güvenliği: gönderilen ID'ler bu tenant'a ait mi (global filter altında `AnyAsync`).
- TenantId interceptor damgalar, client'tan gelmez.
- State machine + bildirim = `PublishShiftHandler`'ın aynısı.
- DTO projection (entity değil) — List'te atanan kişi/pozisyon adını LEFT JOIN ile düz alan.

> [!tip] Yeni modül = eski kalıp Taze bir modüle başlarken "nasıl yapılır?"ı sıfırdan düşünme — en yakın mevcut feature'ı (burada Shift CRUD) aç, birebir taklit et. Tutarlılık, zekâ gösterisinden değerli: sonraki okuyucu (veya gelecekteki sen) tek bir kalıbı öğrenir, her modülde tanır.

---

## 8. Durum (Gün 15 sonu)

**Yeni dosyalar:**
- `Domain/Entities/TaskItem.cs` — entity + `TaskItemStatus`/`TaskPriority`/`TaskCategory` enum'ları
- `Application/Features/Tasks/Create/` — Command+Result, Validator, Handler (atama bildirimi)
- `Application/Features/Tasks/List/` — Query+DTO, Handler (pano projeksiyonu)
- `Application/Features/Tasks/Update/` — Command, Validator, Handler (durum hariç)
- `Application/Features/Tasks/Delete/` — Command, Handler
- `Application/Features/Tasks/Move/` — Command+Result, Handler (**state machine**)
- `API/Controllers/TasksController.cs` — rol yetkileriyle 5 uç
- `tests/Shift.Tests/MoveTaskTests.cs` — 7 state machine testi

**Değişen dosyalar:**
- `Domain/Entities/Notification.cs` — `NotificationType`'a `TaskAssigned`, `TaskCompleted`
- `Application/Common/Interfaces/IShiftDbContext.cs` + `Infrastructure/.../ShiftDbContext.cs` — `DbSet<TaskItem>` + config (FK SetNull/Restrict, query filter, index, maxlength)

**Migration:** `AddTasks` (Tasks tablosu + 5 FK + (BranchId,Status) index). DB'ye uygulandı.

**Test: 65/65 yeşil** (58 + 7 yeni: ToDo→InProgress, →Done damga+bildirim, ToDo→Done atlama, reopen temizliği, aynı-duruma guard, StartedAt sabitliği, oluşturan-null bildirim atlanır).

---

## 9. Açık Borçlar ve Sırada Ne Var (Gün 16)

> [!warning] Bu modülde bilinçli ertelenenler **Tekrarlayan görevler** (günlük/haftalık/aylık otomatik üretim) ve **fotoğraf ekleme** (kanıt fotoğrafı). İkisi de ayrı altyapı ister: tekrar = zamanlanmış üretici (cron/generator); fotoğraf = dosya/blob depolama (projede henüz yok). Çekirdek panoyu önce sağlamlaştırdık; bu ikisi ayrı dilim.

**Görev modülü açık uçları:**
- Tekrarlayan görev üretici yok.
- Fotoğraf/yorum ekleme yok (dosya depolama altyapısı gerekiyor).
- Pozisyona atanan görevde toplu bildirim yok (şimdilik sadece kişi atamasında bildirim).
- Spec 2.2 (Açılış/Kapanış kontrol listeleri) ve 2.3 (Yönetici günlük logu) — Modül 2'nin diğer ayakları, ayrı.

**Mesai/bordro tarafından devreden (Gün 14):**
- Resmi tatil çarpanı + TR tatil takvimi yok.
- Excel (.xlsx) export (ClosedXML).

**Olası Gün 16 yönleri:** (a) Görev modülünü derinleştir (kontrol listeleri 2.2 / yönetici logu 2.3 / tekrarlayan görev); (b) Excel export; (c) Tatil takvimi + tatil çarpanı. Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] `Task` adı yasak (BCL çakışması) → entity `TaskItem`, enum `TaskItemStatus`
- [ ] Kanban = serbest hareket (Jira); tek guard "aynı→aynı reddet"; değer yan etkilerde
- [ ] Done'a giriş: damga + bildirim; Done'dan çıkış (reopen): damgayı **temizle** (simetri)
- [ ] `StartedAt` bir kez (ilk), `CompletedAt` her seferinde (son) — farklı semantik
- [ ] "Kim?" (CompletedBy/CreatedBy) token'dan, client'tan değil (IDOR)
- [ ] Atama = kişi VEYA pozisyon (iki nullable FK + 'en fazla biri' kuralı), polimorfik değil
- [ ] Update durumu değiştiremez — geçiş ayrı uçta (niyet ayrımı → yetki ayrımı)
- [ ] move ucu personele de açık (Owner,Manager,Staff); CRUD yalnız yönetici
- [ ] Yeni modül = en yakın mevcut kalıbı (Shift CRUD) birebir taklit
- [ ] DbSet hem concrete hem interface; tenant filtre + FK SetNull/Restrict + token damgası

#shift #dotnet #backend #faz1 #kanban #gorev #state-machine #ef-core #clean-architecture
