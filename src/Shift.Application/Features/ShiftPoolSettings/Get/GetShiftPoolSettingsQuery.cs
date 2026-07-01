using MediatR;

namespace Shift.Application.Features.ShiftPoolSettings.Get;

// İşletmenin vardiya havuzu onay modunu getirir. Parametre yok — tenant
// token'dan gelir, global filter zaten o tenant'ın kaydını bulur.
public record GetShiftPoolSettingsQuery() : IRequest<ShiftPoolSettingsDto>;

// ApprovalMode int olarak döner (PoolApprovalMode: Open=0, ApprovalRequired=1, Closed=2)
// — projedeki diğer enum DTO'larıyla aynı sözleşme (bkz. ShiftDto.Status).
public record ShiftPoolSettingsDto(int ApprovalMode);
