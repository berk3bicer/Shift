using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPool;

// Havuz aksiyonlarının (Give/Take/Approve/Reject) bildirim fan-out'unu tek
// yerde toplar — üç handler'da (Give/ApprovalRequired, Take/Open, Take/
// ApprovalRequired) AYNI "şube yöneticileri + tüm sahipler" sorgusu tekrar
// ediyor (ClockInHandler.NotifyManagersAsync ile aynı desen). SaveChanges
// çağıran handler'a ait — burası yalnızca _db.Notifications.Add yapar.
internal static class ShiftPoolNotifications
{
    // Şube yöneticileri + tüm sahiplere bildirim (geç-giriş fan-out'uyla aynı hedef sorgusu).
    public static async Task NotifyBranchManagersAsync(
        IShiftDbContext db, Guid branchId, Guid excludeUserId,
        NotificationType type, string message, Guid relatedEntityId, CancellationToken ct)
    {
        var branchManagerIds = await db.UserBranches
            .Where(ub => ub.BranchId == branchId)
            .Join(db.UserRoles, ub => ub.UserId, ur => ur.UserId,
                  (ub, ur) => new { ub.UserId, ur.Role.Type })
            .Where(x => x.Type == RoleType.Manager)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(ct);

        var ownerIds = await db.UserRoles
            .Where(ur => ur.Role.Type == RoleType.Owner)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(ct);

        var targetIds = branchManagerIds.Union(ownerIds).Where(id => id != excludeUserId);

        foreach (var managerId in targetIds)
        {
            db.Notifications.Add(new Notification
            {
                UserId = managerId,
                Type = type,
                Message = message,
                RelatedEntityId = relatedEntityId,
                IsRead = false
            });
        }
    }

    // Aynı şube + aynı pozisyondaki personele bildirim (rol bazlı görünürlükle aynı kriter).
    public static async Task NotifyEligibleStaffAsync(
        IShiftDbContext db, Guid branchId, Guid positionId, Guid excludeUserId,
        NotificationType type, string message, Guid relatedEntityId, CancellationToken ct)
    {
        var eligibleUserIds = await db.Users
            .Where(u => u.PositionId == positionId
                     && u.Id != excludeUserId
                     && db.UserBranches.Any(ub => ub.UserId == u.Id && ub.BranchId == branchId))
            .Select(u => u.Id)
            .ToListAsync(ct);

        foreach (var userId in eligibleUserIds)
        {
            db.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = type,
                Message = message,
                RelatedEntityId = relatedEntityId,
                IsRead = false
            });
        }
    }
}
