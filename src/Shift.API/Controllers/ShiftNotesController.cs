using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.ShiftNotes.Create;
using Shift.Application.Features.ShiftNotes.List;
using Shift.Application.Features.ShiftNotes.Delete;

namespace Shift.API.Controllers;

// Vardiya notları (handoff akışı). Not bırakmak/okumak operasyoneldir → personele açık.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShiftNotesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShiftNotesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Not bırak: vardiyayı kapatan kişi (personel dahil).
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShiftNoteCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Not akışını oku: sonraki vardiya görsün (personel dahil).
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid branchId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate)
    {
        var result = await _mediator.Send(new ListShiftNotesQuery(branchId, fromDate, toDate));
        return Ok(result);
    }

    // Not sil: yönetici her notu, personel yalnız kendi notunu. Rolü burada (JWT) belirleyip
    // handler'a "capability" olarak geçiriyoruz — rol stringi Application'a sızmasın.
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var canDeleteAny = User.IsInRole("Owner") || User.IsInRole("Manager");
        await _mediator.Send(new DeleteShiftNoteCommand(id, canDeleteAny));
        return NoContent();
    }
}
