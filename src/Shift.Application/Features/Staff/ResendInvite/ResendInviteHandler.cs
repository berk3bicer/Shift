using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.Staff.ResendInvite;

public class ResendInviteHandler : IRequestHandler<ResendInviteCommand>
{
    private readonly IShiftDbContext _db;
    private readonly IInvitationService _invites;

    public ResendInviteHandler(IShiftDbContext db, IInvitationService invites)
    {
        _db = db;
        _invites = invites;
    }

    public async Task Handle(ResendInviteCommand request, CancellationToken ct)
    {
        // Global tenant filtresi: başka tenant'ın kullanıcısı görünmez → "bulunamadı".
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        // Aktif hesaba davet linki göndermek, hesabı ele geçirme kapısı açar
        // (accept-invite şifreyi sıfırdan koyar) → yalnız davet-bekleyene izin ver.
        if (user.IsActive)
            throw new InvalidOperationException("Kullanıcı zaten aktif, davet gerekmez.");

        await _invites.SendInviteAsync(user, ct);
    }
}
