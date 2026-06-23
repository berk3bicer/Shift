using MediatR;
using Shift.Application.Common.Services.Overtime;

namespace Shift.Application.Features.Overtime.Summary;

// Bir personelin bir dönemdeki mesai özetini getirir.
// Sonuç doğrudan Calculator'ın ürettiği StaffOvertimeSummary.
public record GetOvertimeSummaryQuery(
    Guid UserId,
    DateOnly From,
    DateOnly To
) : IRequest<StaffOvertimeSummary>;