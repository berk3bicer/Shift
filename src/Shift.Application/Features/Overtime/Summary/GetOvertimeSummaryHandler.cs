using MediatR;
using Shift.Application.Common.Interfaces;
using Shift.Application.Common.Services.Overtime;

namespace Shift.Application.Features.Overtime.Summary;

public class GetOvertimeSummaryHandler
    : IRequestHandler<GetOvertimeSummaryQuery, StaffOvertimeSummary>
{
    private readonly IOvertimeCalculator _calculator;

    public GetOvertimeSummaryHandler(IOvertimeCalculator calculator)
    {
        _calculator = calculator;
    }

    public async Task<StaffOvertimeSummary> Handle(
        GetOvertimeSummaryQuery request, CancellationToken ct)
    {
        // Tüm iş Calculator'da. Handler sadece köprü.
        // Tenant izolasyonu Calculator içindeki global filter ile zaten sağlanıyor:
        // başka tenant'ın personeli sorgulanırsa "bulunamadı" döner.
        return await _calculator.CalculateForUserAsync(
            request.UserId, request.From, request.To, ct);
    }
}