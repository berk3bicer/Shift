using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPool.Decide;

public class DecideShiftSwapHandler : IRequestHandler<DecideShiftSwapCommand, DecideShiftSwapResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;
    private readonly IShiftRuleChecker _ruleChecker;

    public DecideShiftSwapHandler(IShiftDbContext db, ICurrentUserProvider currentUser, IShiftRuleChecker ruleChecker)
    {
        _db = db;
        _currentUser = currentUser;
        _ruleChecker = ruleChecker;
    }

    public async Task<DecideShiftSwapResult> Handle(DecideShiftSwapCommand request, CancellationToken ct)
    {
        var deciderId = _currentUser.GetUserId();
        if (deciderId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var swap = await _db.ShiftSwaps
            .Include(s => s.Shift)
            .FirstOrDefaultAsync(s => s.Id == request.SwapId, ct);
        if (swap is null)
            throw new InvalidOperationException("Havuz talebi bulunamadı.");

        // ── STATE MACHINE KONTROLÜ ──
        // Yalnızca Pending bir talep karara açıktır (DecideTimeOffHandler ile aynı desen).
        if (swap.Status != SwapStatus.Pending)
            throw new InvalidOperationException(
                $"Bu talep zaten sonuçlanmış (durum: {swap.Status}). " +
                "Yalnızca beklemedeki talepler onaylanabilir veya reddedilebilir.");

        var shift = swap.Shift;

        if (request.Decision == SwapDecision.Reject)
        {
            swap.Status = SwapStatus.Rejected;
            swap.UpdatedAt = DateTime.UtcNow;

            _db.Notifications.Add(new Notification
            {
                UserId = swap.RequestedByUserId,
                Type = NotificationType.ShiftPoolRejected,
                Message = "Vardiya havuzu talebiniz reddedildi.",
                RelatedEntityId = shift.Id,
                IsRead = false
            });

            await _db.SaveChangesAsync(ct);
            return new DecideShiftSwapResult(swap.Id, swap.Status.ToString(), shift.Id, (int)shift.Status);
        }

        // ── ONAY: mutasyon burada, ilk defa gerçekleşir ──
        if (swap.Type == SwapType.Give)
        {
            // ── ŞART 1: state drift kontrolü ──
            // Talep Pending beklerken vardiya başka bir yolla (manuel Update) değişmiş
            // olabilir. İlk kontrol anındaki durum artık geçersiz olabilir — tekrar bak.
            if (shift.UserId != swap.RequestedByUserId || shift.Status != ShiftStatus.Published)
                throw new InvalidOperationException(
                    $"Bu vardiya artık sunulamaz (durum değişmiş: {shift.Status}). Onay geçersiz.");

            shift.Status = ShiftStatus.UpForGrabs;
            shift.UpdatedAt = DateTime.UtcNow;

            await ShiftPoolNotifications.NotifyEligibleStaffAsync(
                _db, shift.BranchId, shift.PositionId, swap.RequestedByUserId,
                NotificationType.ShiftUpForGrabs, "Havuzda yeni bir açık vardiya var.",
                shift.Id, ct);
        }
        else // SwapType.Take
        {
            // ── ŞART 1: state drift kontrolü + ShiftRuleChecker'ı ONAY ANINDA tekrar çalıştır ──
            // Talep Pending beklerken talep edene başka bir vardiya atanmış veya bu
            // vardiya başkasınca doldurulmuş olabilir — ilk kontrol geçersiz olabilir.
            var stillTakeable = (shift.UserId is null && shift.Status == ShiftStatus.Published)
                                 || shift.Status == ShiftStatus.UpForGrabs;
            if (!stillTakeable)
                throw new InvalidOperationException(
                    $"Bu vardiya artık kapılamaz (durum değişmiş: {shift.Status}). Onay geçersiz.");

            // excludeShiftId: null — vardiya henüz talep edene ait değil.
            await _ruleChecker.CheckAsync(
                swap.RequestedByUserId, shift.StartTime, shift.EndTime, excludeShiftId: null, ct);

            shift.UserId = swap.RequestedByUserId;
            shift.Status = ShiftStatus.Filled;
            shift.UpdatedAt = DateTime.UtcNow;
        }

        swap.Status = SwapStatus.Approved;
        swap.UpdatedAt = DateTime.UtcNow;

        _db.Notifications.Add(new Notification
        {
            UserId = swap.RequestedByUserId,
            Type = NotificationType.ShiftPoolApproved,
            Message = "Vardiya havuzu talebiniz onaylandı.",
            RelatedEntityId = shift.Id,
            IsRead = false
        });

        await _db.SaveChangesAsync(ct);

        return new DecideShiftSwapResult(swap.Id, swap.Status.ToString(), shift.Id, (int)shift.Status);
    }
}
