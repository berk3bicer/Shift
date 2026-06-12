using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Availabilities.Create;
using Shift.Application.Features.Availabilities.Delete;
using Shift.Application.Features.Availabilities.List;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AvailabilitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AvailabilitiesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Müsaitlik ekleme. Owner/Manager personel adına girebilir.
    // (İleride personel kendi adına da girecek — şimdilik yönetici akışı.)
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAvailabilityCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Bir personelin müsaitlik kayıtları.
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid userId)
    {
        var result = await _mediator.Send(new ListAvailabilitiesQuery(userId));
        return Ok(result);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteAvailabilityCommand(id));
        return NoContent();
    }
}