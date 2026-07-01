using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.ShiftPool.Decide;
using Shift.Application.Features.ShiftPool.Give;
using Shift.Application.Features.ShiftPool.List;
using Shift.Application.Features.ShiftPool.Pending;
using Shift.Application.Features.ShiftPool.Take;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/shift-pool")]
[Authorize]
public class ShiftPoolController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShiftPoolController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Havuzdaki açık/sunulmuş vardiyalar — HERKES kendi pozisyon+şubesine göre görür.
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var result = await _mediator.Send(new ListShiftPoolQuery(), ct);
        return Ok(result);
    }

    // Onay kuyruğu: tüm bekleyen havuz talepleri. Sadece yönetici/sahip.
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet("pending")]
    public async Task<IActionResult> Pending(CancellationToken ct)
    {
        var result = await _mediator.Send(new PendingShiftSwapsQuery(), ct);
        return Ok(result);
    }

    // Sun: sahibi kendi vardiyasını havuza koyar. HERKES kendi vardiyası için.
    [HttpPost("give")]
    public async Task<IActionResult> Give([FromBody] GiveShiftCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }

    // Kap: açık/sunulmuş vardiyayı üstlenir. HERKES kendi pozisyonu için.
    [HttpPost("take")]
    public async Task<IActionResult> Take([FromBody] TakeShiftCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }

    // Onaylama: yalnızca yönetici/sahip. URL'deki id otorite.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DecideShiftSwapCommand(id, SwapDecision.Approve), ct);
        return Ok(result);
    }

    // Reddetme: yalnızca yönetici/sahip. URL'deki id otorite.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DecideShiftSwapCommand(id, SwapDecision.Reject), ct);
        return Ok(result);
    }
}
