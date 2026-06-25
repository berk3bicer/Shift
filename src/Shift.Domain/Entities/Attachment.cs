using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Bir varlığa iliştirilmiş dosya (MVP: kanıt FOTOĞRAFI). Generic: hem göreve (TaskItem)
// hem checklist madde işaretine (ChecklistRunItem) bağlanır → iki ayrı tabloya kolon
// eklemek yerine tek tablo + polimorfik sahip (OwnerType + OwnerId).
//
// Sahibe FK YOK (Notification.RelatedEntityId deseni): polimorfik referans tek FK ile
// ifade edilemez; sahip silinince temizlik uygulama tarafında. Object key storage'da;
// bu kayıt sadece METADATA + key'i tutar (byte'lar R2/mock'ta).
public class Attachment : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Polimorfik sahip: hangi tür varlık + onun Id'si.
    public AttachmentOwnerType OwnerType { get; set; }
    public Guid OwnerId { get; set; }

    // Storage'daki object key (ör. "task/<id>/<guid>.jpg"). Byte'lar storage'da.
    public string StorageKey { get; set; } = null!;

    public string? ContentType { get; set; }   // image/jpeg ...
    public string? FileName { get; set; }       // orijinal dosya adı (gösterim)

    // Kim yükledi (token'dan). Silinse kayıt durur → SetNull.
    public Guid? UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }
}

// İliştirmenin bağlandığı varlık türü. Yeni tür gerekince buraya eklenir.
public enum AttachmentOwnerType
{
    Task = 0,              // TaskItem — tamamlanan göreve kanıt fotoğrafı (spec 2.1)
    ChecklistRunItem = 1   // checklist madde işareti — fotoğraflı doğrulama (spec 2.2)
}
