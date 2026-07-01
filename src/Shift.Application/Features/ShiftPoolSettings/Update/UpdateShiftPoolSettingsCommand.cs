using MediatR;
using Shift.Application.Features.ShiftPoolSettings.Get;

namespace Shift.Application.Features.ShiftPoolSettings.Update;

// İşletmenin vardiya havuzu onay modunu günceller.
// ApprovalMode: PoolApprovalMode enum'unun int karşılığı (Open=0, ApprovalRequired=1, Closed=2).
public record UpdateShiftPoolSettingsCommand(int ApprovalMode) : IRequest<ShiftPoolSettingsDto>;
