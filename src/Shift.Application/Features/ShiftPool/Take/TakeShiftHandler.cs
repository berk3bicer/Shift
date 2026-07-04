using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Exceptions;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;
using Entities = Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPool.Take;

public class TakeShiftHandler : IRequestHandler<TakeShiftCommand, ShiftSwapDto>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;
    private readonly IShiftRuleChecker _ruleChecker;

    public TakeShiftHandler(IShiftDbContext db, ICurrentUserProvider currentUser, IShiftRuleChecker ruleChecker)
    {
        _db = db;
        _currentUser = currentUser;
        _ruleChecker = ruleChecker;
    }

    public async Task<ShiftSwapDto> Handle(TakeShiftCommand request, CancellationToken ct)
    {
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var shift = await _db.Shifts.FirstOrDefaultAsync(s => s.Id == request.ShiftId, ct);
        if (shift is null)
            throw new InvalidOperationException("Vardiya bulunamadı.");

        // ── STATE MACHINE ──
        // Kapılabilir iki durum: açık (UserId=null + Published, hiç sunulmamış)
        // veya sunulmuş (UpForGrabs, sahibi Give etti).
        var isOpenShift = shift.UserId is null && shift.Status == ShiftStatus.Published;
        var isUpForGrabs = shift.Status == ShiftStatus.UpForGrabs;
        if (!isOpenShift && !isUpForGrabs)
            throw new InvalidOperationException(
                $"Bu vardiya kapılamaz (durum: {shift.Status}). Yalnızca açık veya sunulmuş vardiyalar kapılabilir.");

        // Rol bazlı görünürlük: yalnızca kendi pozisyonundaki vardiyayı kapabilir (403).
        var caller = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (caller is null || caller.PositionId != shift.PositionId)
            throw new ForbiddenAccessException("Bu vardiya sizin pozisyonunuzda değil.");

        var settings = await _db.ShiftPoolSettings.FirstOrDefaultAsync(ct) ?? new Entities.ShiftPoolSettings();
        if (settings.ApprovalMode == PoolApprovalMode.Closed)
            throw new ForbiddenAccessException("Vardiya havuzu bu işletmede kapalı.");

        // ── İş Kanunu: çakışma hard-block (throw → global handler 400'e çevirir) ──
        // excludeShiftId: null — bu vardiya henüz taker'a ait değil, kendi
        // takviminde hariç tutulacak bir kayıt yok.
        await _ruleChecker.CheckAsync(userId.Value, shift.StartTime, shift.EndTime, excludeShiftId: null, ct);

        var swap = new ShiftSwap
        {
            ShiftId = shift.Id,
            RequestedByUserId = userId.Value,
            TargetUserId = null,
            Type = SwapType.Take,
            Status = settings.ApprovalMode == PoolApprovalMode.Open
                ? SwapStatus.Approved
                : SwapStatus.Pending
        };
        _db.ShiftSwaps.Add(swap);

        if (settings.ApprovalMode == PoolApprovalMode.Open)
        {
            shift.UserId = userId.Value;
            shift.Status = ShiftStatus.Filled;
            shift.UpdatedAt = DateTime.UtcNow;

            await ShiftPoolNotifications.NotifyBranchManagersAsync(
                _db, shift.BranchId, userId.Value,
                NotificationType.ShiftTaken, "Bir vardiya havuzdan dolduruldu.",
                shift.Id, ct);
        }
        else
        {
            // ApprovalRequired: Shift DEĞİŞMEZ, yönetici onaylayana kadar eski sahibinde/açık kalır.
            await ShiftPoolNotifications.NotifyBranchManagersAsync(
                _db, shift.BranchId, userId.Value,
                NotificationType.ShiftPoolActionRequested,
                "Bir personel açık vardiya almak istiyor, onayınız bekleniyor.",
                swap.Id, ct);
        }

        await _db.SaveChangesAsync(ct);

        return new ShiftSwapDto(
            swap.Id, swap.ShiftId, swap.RequestedByUserId, caller.FullName,
            (int)swap.Type, (int)swap.Status, (int)shift.Status, swap.CreatedAt);
    }
}
