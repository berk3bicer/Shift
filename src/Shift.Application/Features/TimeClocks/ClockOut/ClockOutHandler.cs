using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.TimeClocks.ClockOut;

public class ClockOutHandler : IRequestHandler<ClockOutCommand, ClockOutResult>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public ClockOutHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ClockOutResult> Handle(ClockOutCommand request, CancellationToken ct)
    {
        var userId = _currentUser.GetUserId();
        if (userId is null)
            throw new UnauthorizedAccessException("Oturum bulunamadı.");

        // ── AÇIK KAYDI BUL ──
        // Bu personelin çıkış yapılmamış (CheckOutTime == null) kaydı.
        // ClockIn aynı anda yalnızca bir açık kayda izin verdiği için
        // burada en fazla bir tane bulunur. Yoksa → giriş yapmadan çıkış yapılamaz.
        var openRecord = await _db.TimeClocks
            .FirstOrDefaultAsync(
                tc => tc.UserId == userId.Value && tc.CheckOutTime == null, ct);

        if (openRecord is null)
            throw new InvalidOperationException(
                "Açık bir giriş kaydınız yok. Önce giriş yapmalısınız.");

        var now = DateTime.UtcNow;

        // Güvenlik kontrolü: çıkış, girişten önce olamaz (saat/timezone anomalisi).
        // Normalde imkânsız ama veri bütünlüğü için koruyoruz.
        if (now < openRecord.CheckInTime)
            throw new InvalidOperationException(
                "Çıkış zamanı giriş zamanından önce olamaz.");

        // ── KAYDI KAPAT ──
        openRecord.CheckOutTime = now;
        openRecord.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);

        // Çalışılan süre = çıkış - giriş (dakika). Mesai hesabı (Gün 10)
        // bunu saat bazında ve İş Kanunu çarpanlarıyla işleyecek; burada
        // sadece ham süreyi bilgi olarak döneriz.
        var workedMinutes = (now - openRecord.CheckInTime).TotalMinutes;

        return new ClockOutResult(
            openRecord.Id,
            openRecord.CheckInTime,
            now,
            workedMinutes);
    }
}