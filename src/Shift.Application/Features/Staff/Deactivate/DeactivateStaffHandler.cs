using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;
using Shift.Domain.Entities;

namespace Shift.Application.Features.Staff.Deactivate;

public class DeactivateStaffHandler : IRequestHandler<DeactivateStaffCommand>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public DeactivateStaffHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(DeactivateStaffCommand request, CancellationToken ct)
    {
        // Global tenant filtresi: başka tenant'ın kullanıcısı görünmez → "bulunamadı" (IDOR koruması).
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        // Kendini pasifleştiren kullanıcı hesabını kilitler (kurtarma derdi doğar);
        // son-owner-kendini-kilitler senaryosunu da baştan kapatır.
        if (user.Id == _currentUser.GetUserId())
            throw new InvalidOperationException("Kendinizi pasifleştiremezsiniz.");

        // Zaten pasifse 400 — idempotent davranmak yanlış id'yi / çift tıkı sessizce yutar.
        // (Davet-bekleyen de IsActive=false: onu "pasifleştirmek" zaten anlamsız, aynı mesaj yeter.)
        if (!user.IsActive)
            throw new InvalidOperationException("Kullanıcı zaten pasif.");

        // Son aktif Owner pasifleşirse işletme sahipsiz kalır (ayar/fatura/owner-yetkili
        // işler kilitlenir). Owner'sa tenant'ta başka aktif Owner şart.
        var isOwner = await _db.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Type)
            .AnyAsync(t => t == RoleType.Owner, ct);

        if (isOwner)
        {
            var otherActiveOwnerExists = await _db.UserRoles
                .Where(ur => ur.UserId != user.Id)
                .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Type })
                .Where(x => x.Type == RoleType.Owner)
                .Join(_db.Users, x => x.UserId, u => u.Id, (x, u) => u.IsActive)
                .AnyAsync(active => active, ct);

            if (!otherActiveOwnerExists)
                throw new InvalidOperationException(
                    "Son aktif işletme sahibi pasifleştirilemez. Önce başka bir sahip atayın.");
        }

        user.IsActive = false;
        await _db.SaveChangesAsync(ct);
    }
}
