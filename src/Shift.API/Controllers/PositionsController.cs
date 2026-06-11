using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Positions.Create;
using Shift.Application.Features.Positions.List;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PositionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PositionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Pozisyon oluşturma: sahip veya yönetici
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePositionCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Pozisyon listesi: sahip veya yönetici (vardiya kurarken seçilecek)
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await _mediator.Send(new ListPositionsQuery());
        return Ok(result);
    }
}