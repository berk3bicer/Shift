using Shift.Domain.Common;

namespace Shift.Domain.Entities;

// Vardiya Havuzu'ndaki bir Give/Take talebinin kaydı. Spec veri modeliyle
// hizalı: TalepEden=RequestedByUserId, Hedef=TargetUserId. Her Give/Take
// çağrısı bir satır üretir — audit + onay kuyruğu bu tablodan okunur.
public class ShiftSwap : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ShiftId { get; set; }
    public Shift Shift { get; set; } = null!;

    // Talep eden: Give'de vardiyayı sunan sahibi, Take'te vardiyayı almak isteyen kişi.
    public Guid RequestedByUserId { get; set; }
    public User RequestedByUser { get; set; } = null!;

    // Hedef: bu turda hep null (Give/Take havuza açık, kişiye özel değil).
    // Takas (Trade) ileride belirli bir kişiye yöneltileceği için ayrılmış.
    public Guid? TargetUserId { get; set; }
    public User? TargetUser { get; set; }

    public SwapType Type { get; set; }
    public SwapStatus Status { get; set; } = SwapStatus.Pending;
}

public enum SwapType
{
    Give = 0,   // Sun — sahibi kendi vardiyasını havuza koyar
    Take = 1,   // Kap — açık/sunulmuş vardiyayı üstlenir
    Trade = 2   // Takas — bu turda KULLANILMIYOR, spec uyumu için yer tutucu
}

public enum SwapStatus
{
    Pending = 0,   // ApprovalRequired modunda yönetici kararını bekliyor
    Approved = 1,  // Onaylandı (Open modunda anında, ApprovalRequired'da yönetici onayıyla)
    Rejected = 2   // Yönetici reddetti — Shift değişmedi
}
