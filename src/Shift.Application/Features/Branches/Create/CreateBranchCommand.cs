using MediatR;

namespace Shift.Application.Features.Branches.Create;

// Yeni şube oluşturur. TenantId elle verilmez —
// SaveChanges interceptor token'daki tenant'tan otomatik damgalar.
public record CreateBranchCommand(
    string Name,
    string? Address,
    double? Latitude,
    double? Longitude
) : IRequest<CreateBranchResult>;

public record CreateBranchResult(Guid BranchId);