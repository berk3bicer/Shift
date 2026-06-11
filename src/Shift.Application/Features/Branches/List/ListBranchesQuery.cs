using MediatR;

namespace Shift.Application.Features.Branches.List;

// Girdi taşımaz: hangi tenant olduğu token'dan/filtreden gelir.
public record ListBranchesQuery() : IRequest<IReadOnlyList<BranchDto>>;

// API'ye dönen sözleşme. Entity değil — sadece gösterilecek alanlar.
public record BranchDto(
    Guid Id,
    string Name,
    string? Address,
    double? Latitude,
    double? Longitude,
    bool IsActive
);