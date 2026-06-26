using MediatR;

namespace Shift.Application.Features.Staff.List;

// İşletmenin personel listesi (ekip roster'ı). Atama dropdown'ları + seed idempotency
// (e-posta → id) için. Tenant filtresi otomatik.
public record ListStaffQuery() : IRequest<IReadOnlyList<StaffDto>>;

public record StaffDto(
    Guid Id,
    string FullName,
    string Email,
    Guid? PositionId,
    string? PositionName,
    int[] Roles,        // RoleType int'leri (bir kişinin çok rolü olabilir)
    bool IsActive
);
