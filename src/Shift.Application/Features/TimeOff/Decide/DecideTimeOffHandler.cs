using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.TimeOff.Decide;

public class DecideTimeOffHandler
    : IRequestHandler<DecideTimeOffCommand, DecideTimeOffResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public DecideTimeOffHandler(
        IShiftDbContext db,
        ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<DecideTimeOffResult> Handle(
        DecideTimeOffCommand request, CancellationToken ct)
    {
        // Kararı veren yönetici = login olan kullanıcı (token'dan).
        var deciderId = _currentUser.GetUserId();
        if (deciderId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // Talebi bul. Global filter sayesinde yalnızca kendi tenant'ımızdakini buluruz.
        var timeOff = await _db.TimeOffRequests
            .FirstOrDefaultAsync(t => t.Id == request.Id, ct);

        if (timeOff is null)
            throw new InvalidOperationException("İzin talebi bulunamadı.");

        // ── STATE MACHINE KONTROLÜ ──
        // Yalnızca Pending bir talep karara açıktır. Zaten karara bağlanmış
        // (Approved/Rejected) bir talep yeniden karara alınamaz — terminal durum.
        if (timeOff.Status != TimeOffStatus.Pending)
            throw new InvalidOperationException(
                $"Bu talep zaten sonuçlanmış (durum: {timeOff.Status}). " +
                "Yalnızca beklemedeki talepler onaylanabilir veya reddedilebilir.");

        // Karara göre hedef durumu belirle.
        var newStatus = request.Decision == TimeOffDecision.Approve
            ? TimeOffStatus.Approved
            : TimeOffStatus.Rejected;

        // Geçişi uygula + denetim alanlarını damgala.
        timeOff.Status = newStatus;
        timeOff.DecidedByUserId = deciderId.Value;
        timeOff.DecisionNote = request.DecisionNote;
        timeOff.UpdatedAt = DateTime.UtcNow;

        // ── PERSONEL BİLDİRİMİ ──
        // Kararı talep eden personele bildir (tek kişi — timeOff.UserId zaten elde).
        // Onay/red tipine göre ayrı NotificationType. Karar notu varsa mesaja eklenir.
        // Geçiş + bildirim tek SaveChanges → atomik.
        // Spec §5.2: kanal Push + E-posta; şimdilik yalnız in-app Notification (FCM/SMTP yok).
        var approved = newStatus == TimeOffStatus.Approved;
        var message = approved ? "İzin talebin onaylandı." : "İzin talebin reddedildi.";
        if (!string.IsNullOrWhiteSpace(request.DecisionNote))
            message += $" Not: {request.DecisionNote}";

        _db.Notifications.Add(new Notification
        {
            UserId = timeOff.UserId,
            Type = approved ? NotificationType.TimeOffApproved : NotificationType.TimeOffRejected,
            Message = message,
            RelatedEntityId = timeOff.Id,   // tıkla → izin talebine git
            IsRead = false
        });

        await _db.SaveChangesAsync(ct);

        return new DecideTimeOffResult(timeOff.Id, newStatus.ToString());
    }
}