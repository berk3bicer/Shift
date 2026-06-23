using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.OvertimeSettings.Get;
using Shift.Application.Features.OvertimeSettings.Update;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/overtime-settings")]
[Authorize]
public class OvertimeSettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OvertimeSettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Mesai ayarlarını getir. Owner + Manager görebilir (yönetici de bilmeli).
    // Kayıt yoksa lazy default döner (varsayılan çarpanlar).
    [HttpGet]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetOvertimeSettingsQuery(), ct);
        return Ok(result);
    }

    // Mesai ayarlarını güncelle. SADECE Owner — bu maaş/para kuralı.
    // İlk çağrıda gerçek kaydı yaratır (upsert).
    [HttpPut]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Update(
        [FromBody] UpdateOvertimeSettingsCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }
}