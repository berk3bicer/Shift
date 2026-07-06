using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Announcements.Create;

// Duyuruyu kalıcılaştırır + hedef kullanıcılara bildirim FAN-OUT'u yapar (Gün 8 altyapısı).
// Hedef = şube (varsa) ∩ rol (varsa) kesişimi; gönderen de kapsamdaysa alır (kendi
// duyurusunu kendi zilinde görür). Duyuru + tüm bildirimler tek SaveChanges → atomik
// (ya hepsi gider ya hiçbiri).
public class CreateAnnouncementHandler
    : IRequestHandler<CreateAnnouncementCommand, CreateAnnouncementResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public CreateAnnouncementHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateAnnouncementResult> Handle(
        CreateAnnouncementCommand request, CancellationToken ct)
    {
        // FK güvenliği: hedef şube bu tenant'a ait mi?
        if (request.BranchId is { } branchId)
        {
            var branchExists = await _db.Branches.AnyAsync(b => b.Id == branchId, ct);
            if (!branchExists)
                throw new InvalidOperationException("Hedef şube bulunamadı.");
        }

        var senderId = _currentUser.GetUserId();

        var announcement = new Announcement
        {
            // TenantId YOK — interceptor damgalar.
            Title = request.Title,
            Body = request.Body,
            BranchId = request.BranchId,
            TargetRole = request.TargetRole,
            CreatedByUserId = senderId
        };
        _db.Announcements.Add(announcement);

        // ── Hedef kullanıcı çözümü (fan-out) ──
        // Tüm sorgular global tenant filtresi altında → başka tenant'a sızmaz.
        var recipients = _db.Users.AsQueryable();

        // Şube hedefi: o şubedeki kullanıcılar (UserBranch köprüsü).
        if (request.BranchId is { } scopeBranch)
            recipients = recipients.Where(u =>
                _db.UserBranches.Any(ub => ub.UserId == u.Id && ub.BranchId == scopeBranch));

        // Rol hedefi: o role sahip kullanıcılar (UserRole → Role.Type).
        if (request.TargetRole is { } role)
            recipients = recipients.Where(u =>
                _db.UserRoles.Any(ur => ur.UserId == u.Id && ur.Role.Type == role));

        // Gönderen de şube∩rol kapsamındaysa alıcıdır — kendi duyurusu kendi zilinde
        // görünür. Kapsam dışındaysa (ör. farklı şube) doğal olarak almaz.
        var recipientIds = await recipients
            .Select(u => u.Id)
            .ToListAsync(ct);

        foreach (var userId in recipientIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = NotificationType.AnnouncementPosted,
                Message = announcement.Title,          // inbox'ta başlık görünür
                RelatedEntityId = announcement.Id,     // tıkla → duyuruya git
                IsRead = false
            });
        }

        await _db.SaveChangesAsync(ct);

        return new CreateAnnouncementResult(announcement.Id, recipientIds.Count);
    }
}
