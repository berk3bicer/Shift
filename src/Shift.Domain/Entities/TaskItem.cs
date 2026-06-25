using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Bir Kanban görev kartı. Bir şubeye ait; kişiye VEYA pozisyona atanabilir
// (ya da havuzda boş durur). Durumu üç sütunlu panoda yaşar: Yapılacak →
// Devam Ediyor → Tamamlandı (spec Modül 2.1).
//
// İsim NEDEN TaskItem, Task DEĞİL: `Task` = System.Threading.Tasks.Task ile çakışır
// (her async handler imzası Task<T> döner). `TaskItemStatus` da BCL'deki TaskStatus
// ile çakışmasın diye Item'lı. Bilinçli isimlendirme — çakışmayı baştan keser.
public class TaskItem : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Görev bir şubenin operasyonudur (o şubenin masaları, mutfağı...).
    // Şube silinse görev geçmişi uçmasın → Restrict.
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    // ── İçerik ──
    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    // Son tarih (opsiyonel). UTC. null = tarihsiz görev.
    public DateTime? DueDate { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public TaskCategory Category { get; set; }

    // ── Atama: kişiye VEYA pozisyona (spec: "kişiye veya pozisyona") ──
    // İkisi de null = havuzda (atanmamış). İkisi birden dolu OLAMAZ (validator engeller).
    // Pozisyona atama = "tüm garsonlar yapabilir". Personel/pozisyon silinse görev
    // yaşasın, atama kopsun → SetNull (ikisi de nullable).
    public Guid? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }

    public Guid? AssignedPositionId { get; set; }
    public Position? AssignedPosition { get; set; }

    // ── Durum (Kanban state machine) ──
    public TaskItemStatus Status { get; set; } = TaskItemStatus.ToDo;

    // ── Audit / yaşam döngüsü zaman damgaları ──
    // Görevi kim oluşturdu/atadı → tamamlanma bildirimi buna gider (spec: "atayan
    // yöneticiye"). Token'dan gelir, client'tan değil. Kullanıcı silinse durur → SetNull.
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    // İlk kez InProgress'e geçince damgalanır (bir daha ezilmez). null = hiç başlanmadı.
    public DateTime? StartedAt { get; set; }

    // Done'a geçince damgalanır; reopen'da (Done'dan çıkınca) temizlenir.
    public DateTime? CompletedAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public User? CompletedByUser { get; set; }
}

// Kanban sütunları. Sıra anlamlı (ToDo<InProgress<Done) ama geçiş serbest (Jira
// benzeri: her sütun → her sütun). State machine MoveTaskHandler'da.
public enum TaskItemStatus
{
    ToDo = 0,        // Yapılacak
    InProgress = 1,  // Devam Ediyor
    Done = 2         // Tamamlandı
}

// Öncelik (spec: düşük/orta/yüksek/acil).
public enum TaskPriority
{
    Low = 0,      // Düşük
    Medium = 1,   // Orta
    High = 2,     // Yüksek
    Urgent = 3    // Acil
}

// Görev kategorisi (spec: Temizlik/Servis/Mutfak/Tedarik/Teknik/Eğitim).
public enum TaskCategory
{
    Cleaning = 0,   // Temizlik
    Service = 1,    // Servis
    Kitchen = 2,    // Mutfak
    Supply = 3,     // Tedarik
    Technical = 4,  // Teknik
    Training = 5    // Eğitim
}
