using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Overtime.Summary;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/overtime")]
[Authorize]
public class OvertimeController : ControllerBase
{
    private readonly IMediator _mediator;

    public OvertimeController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Bir personelin bir dönemdeki mesai özeti (saat bazlı, haftalık kırılımlı).
    // Owner + Manager erişebilir. Tarihler query string'den: ?from=2026-06-01&to=2026-06-30
    [HttpGet("summary")]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> Summary(
        [FromQuery] Guid userId,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetOvertimeSummaryQuery(userId, from, to), ct);
        return Ok(result);
    }
}