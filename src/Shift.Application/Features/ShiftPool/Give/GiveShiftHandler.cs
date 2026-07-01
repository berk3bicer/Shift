using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Exceptions;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;
using Entities = Shift.Domain.Entities;

namespace Shift.Application.Features.ShiftPool.Give;

public class GiveShiftHandler : IRequestHandler<GiveShiftCommand, ShiftSwapDto>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public GiveShiftHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ShiftSwapDto> Handle(GiveShiftCommand request, CancellationToken ct)
    {
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        var shift = await _db.Shifts.FirstOrDefaultAsync(s => s.Id == request.ShiftId, ct);
        if (shift is null)
            throw new InvalidOperationException("Vardiya bulunamadı.");

        // Sahiplik kontrolü — başkasının vardiyasını sunamaz (IDOR/yetki, 403).
        if (shift.UserId != userId.Value)
            throw new ForbiddenAccessException("Yalnızca kendi vardiyanızı havuza sunabilirsiniz.");

        // ── STATE MACHINE ──
        // Yalnızca yayınlanmış bir vardiya sunulabilir (Draft henüz personele
        // görünmüyor; zaten UpForGrabs/Filled olan tekrar sunulamaz).
        if (shift.Status != ShiftStatus.Published)
            throw new InvalidOperationException(
                $"Bu vardiya sunulamaz (durum: {shift.Status}). Yalnızca yayınlanmış vardiyalar havuza sunulabilir.");

        var settings = await _db.ShiftPoolSettings.FirstOrDefaultAsync(ct) ?? new Entities.ShiftPoolSettings();
        if (settings.ApprovalMode == PoolApprovalMode.Closed)
            throw new ForbiddenAccessException("Vardiya havuzu bu işletmede kapalı.");

        var swap = new ShiftSwap
        {
            ShiftId = shift.Id,
            RequestedByUserId = userId.Value,
            TargetUserId = null,
            Type = SwapType.Give,
            Status = settings.ApprovalMode == PoolApprovalMode.Open
                ? SwapStatus.Approved
                : SwapStatus.Pending
        };
        _db.ShiftSwaps.Add(swap);

        if (settings.ApprovalMode == PoolApprovalMode.Open)
        {
            // Açık modda anında havuza düşer — uygun personele bildirim.
            shift.Status = ShiftStatus.UpForGrabs;
            shift.UpdatedAt = DateTime.UtcNow;

            await ShiftPoolNotifications.NotifyEligibleStaffAsync(
                _db, shift.BranchId, shift.PositionId, userId.Value,
                NotificationType.ShiftUpForGrabs, "Havuzda yeni bir açık vardiya var.",
                shift.Id, ct);
        }
        else
        {
            // ── SABİTLENMİŞ ÜRÜN KARARI ──
            // ApprovalRequired modunda Shift DEĞİŞMEZ, Published kalır — onay
            // yalnızca havuza düşmeyi tetikler. Yöneticiye onay bildirimi.
            await ShiftPoolNotifications.NotifyBranchManagersAsync(
                _db, shift.BranchId, userId.Value,
                NotificationType.ShiftPoolActionRequested,
                "Bir personel vardiyasını havuza sunmak istiyor, onayınız bekleniyor.",
                swap.Id, ct);
        }

        await _db.SaveChangesAsync(ct);

        var requester = await _db.Users.FirstAsync(u => u.Id == userId.Value, ct);

        return new ShiftSwapDto(
            swap.Id, swap.ShiftId, swap.RequestedByUserId, requester.FullName,
            (int)swap.Type, (int)swap.Status, (int)shift.Status, swap.CreatedAt);
    }
}
