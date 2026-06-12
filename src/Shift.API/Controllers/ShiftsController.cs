using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Shifts.Create;
using Shift.Application.Features.Shifts.Update;
using Shift.Application.Features.Shifts.Delete;
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

    // Vardiya güncelleme: yalnızca sahip veya yönetici
    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateShiftCommand command)
    {
        // URL'deki id otorite — body'deki Id ile değiştirilemez (güvenlik).
        var result = await _mediator.Send(command with { Id = id });
        return Ok(result);
    }

    // Vardiya silme: yalnızca sahip veya yönetici
    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteShiftCommand(id));
        return NoContent();
    }
}