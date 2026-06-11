using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Shifts.Create;
using Shift.Application.Features.Shifts.List;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShiftsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShiftsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Vardiya oluşturma: yalnızca sahip veya yönetici
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShiftCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Takvim için vardiya listesi: sahip, yönetici (personel kendi vardiyasını
    // ileride ayrı bir "benim vardiyalarım" endpoint'inden görecek)
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid branchId,
        [FromQuery] DateTime rangeStart,
        [FromQuery] DateTime rangeEnd)
    {
        var result = await _mediator.Send(new ListShiftsQuery(branchId, rangeStart, rangeEnd));
        return Ok(result);
    }
}