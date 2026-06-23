using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.TimeClocks.ClockIn;
using Shift.Application.Features.TimeClocks.ClockOut;
using Shift.Application.Features.TimeClocks.List;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeClocksController : ControllerBase
{
    private readonly IMediator _mediator;

    public TimeClocksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Giriş yapma: login olan herkes (Staff dahil). Kim olduğu token'dan gelir.
    [HttpPost("clock-in")]
    public async Task<IActionResult> ClockIn([FromBody] ClockInCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Çıkış yapma: login olan herkes. Açık kayıt otomatik bulunur, parametre yok.
    [HttpPost("clock-out")]
    public async Task<IActionResult> ClockOut()
    {
        var result = await _mediator.Send(new ClockOutCommand());
        return Ok(result);
    }

    // Kendi puantaj geçmişim: login olan herkes (token'dan kimlik).
    [HttpGet("mine")]
    public async Task<IActionResult> Mine(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var result = await _mediator.Send(
            new ListTimeClocksQuery(Mine: true, BranchId: null, From: from, To: to));
        return Ok(result);
    }

    // Bir şubenin tüm puantajı: yalnızca yönetici/sahip.
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid branchId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var result = await _mediator.Send(
            new ListTimeClocksQuery(Mine: false, BranchId: branchId, From: from, To: to));
        return Ok(result);
    }
}