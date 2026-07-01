using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.ShiftPoolSettings.Get;
using Shift.Application.Features.ShiftPoolSettings.Update;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/shift-pool-settings")]
[Authorize]
public class ShiftPoolSettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShiftPoolSettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Onay modunu getir. Owner + Manager görebilir. Kayıt yoksa lazy default (Open) döner.
    [HttpGet]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetShiftPoolSettingsQuery(), ct);
        return Ok(result);
    }

    // Onay modunu güncelle. SADECE Owner — işletme genelinde davranışı değiştiren karar.
    [HttpPut]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Update(
        [FromBody] UpdateShiftPoolSettingsCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }
}
