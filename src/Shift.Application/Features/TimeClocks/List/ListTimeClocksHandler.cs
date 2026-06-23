using MediatR;
using Microsoft.EntityFrameworkCore;
using Shift.Application.Common.Interfaces;

namespace Shift.Application.Features.TimeClocks.List;

public class ListTimeClocksHandler
    : IRequestHandler<ListTimeClocksQuery, IReadOnlyList<TimeClockDto>>
{
    private readonly IShiftDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public ListTimeClocksHandler(IShiftDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<TimeClockDto>> Handle(
        ListTimeClocksQuery request, CancellationToken ct)
    {
        // Global filter zaten tenant izolasyonunu sağlıyor; sorgu sadece
        // bu tenant'ın kayıtlarını görür. Üstüne kullanım filtrelerini bindiriyoruz.
        var query = _db.TimeClocks.AsQueryable();

        if (request.Mine)
        {
            // Personel görünümü: yalnızca kendi kayıtlarım. Token'dan kimlik.
            var userId = _currentUser.GetUserId();
            if (userId is null)
                throw new UnauthorizedAccessException("Oturum bulunamadı.");

            query = query.Where(tc => tc.UserId == userId.Value);
        }
        else if (request.BranchId is not null)
        {
            // Yönetici görünümü: belirli şubenin tüm puantajı.
            query = query.Where(tc => tc.BranchId == request.BranchId.Value);
        }

        // Tarih aralığı (opsiyonel) — giriş anına göre filtrele.
        if (request.From is not null)
            query = query.Where(tc => tc.CheckInTime >= request.From.Value);
        if (request.To is not null)
            query = query.Where(tc => tc.CheckInTime <= request.To.Value);

        // En yeni giriş en üstte.
        var items = await query
            .OrderByDescending(tc => tc.CheckInTime)
            .Select(tc => new TimeClockDto(
                tc.Id,
                tc.UserId,
                tc.User.FullName,
                tc.BranchId,
                tc.CheckInTime,
                tc.CheckOutTime,
                tc.Method.ToString(),
                tc.IsLate,
                // Açık kayıtta süre yok (null). Kapalıda dakika cinsinden süre.
                tc.CheckOutTime != null
                    ? (double?)(tc.CheckOutTime.Value - tc.CheckInTime).TotalMinutes
                    : null))
            .ToListAsync(ct);

        return items;
    }
}