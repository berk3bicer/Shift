using MediatR;

namespace Shift.Application.Features.TimeClocks.List;

// Puantaj listesi. İki kullanım:
//   mine=true  → personel kendi giriş-çıkış geçmişini görür (BranchId yok sayılır)
//   mine=false → yönetici bir şubenin tüm puantajını görür (BranchId ile filtrelenir)
// Tarih aralığı opsiyonel; verilmezse tüm geçmiş döner.
public record ListTimeClocksQuery(
    bool Mine,
    Guid? BranchId,
    DateTime? From,
    DateTime? To
) : IRequest<IReadOnlyList<TimeClockDto>>;

// Listede dönen kayıt. Kullanıcı adını da içerir (yönetici görünümünde
// "kim" bilgisi lazım). WorkedMinutes açık kayıtta null (henüz çıkış yok).
public record TimeClockDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    Guid BranchId,
    DateTime CheckInTime,
    DateTime? CheckOutTime,
    string Method,
    bool IsLate,
    double? WorkedMinutes
);