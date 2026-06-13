using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.TimeOff.Create;
using Shift.Application.Features.TimeOff.Decide;
using Shift.Application.Features.TimeOff.List;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeOffRequestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TimeOffRequestsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // İzin talebi oluşturma: HERKES kendi adına açabilir (Staff dahil).
    // UserId token'dan geldiği için ekstra rol kısıtı koymuyoruz —
    // login olan herkes kendi izin talebini açabilmeli.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTimeOffCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Bir personelin izin talepleri: yönetici akışı (onay için talepleri görür).
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid userId)
    {
        var result = await _mediator.Send(new ListTimeOffQuery(userId));
        return Ok(result);
    }

    // Onaylama: yalnızca yönetici/sahip. URL'deki id otorite.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] DecideTimeOffBody? body)
    {
        var command = new DecideTimeOffCommand(id, TimeOffDecision.Approve, body?.DecisionNote);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Reddetme: yalnızca yönetici/sahip. URL'deki id otorite.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] DecideTimeOffBody? body)
    {
        var command = new DecideTimeOffCommand(id, TimeOffDecision.Reject, body?.DecisionNote);
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}

// approve/reject body'si sadece opsiyonel not taşır. Karar URL'den (approve/reject),
// id URL'den geliyor — body'de yalnızca not var.
public record DecideTimeOffBody(string? DecisionNote);