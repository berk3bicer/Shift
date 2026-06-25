using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Announcements.Create;
using Shift.Application.Features.Announcements.List;
using Shift.Application.Features.Announcements.Get;

namespace Shift.API.Controllers;

// Duyurular (tek yönlü, yöneticiden role/ekibe). Oluşturma/liste yönetici; tekil
// görüntüleme personele açık (bildirimden tıklayıp okur).
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnnouncementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Duyuru yayınla + hedef kullanıcılara bildirim: yöneticiden.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAnnouncementCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Duyuru listesi (yönetim görünümü).
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid? branchId,
        [FromQuery] int? targetRole)
    {
        var result = await _mediator.Send(new ListAnnouncementsQuery(branchId, targetRole));
        return Ok(result);
    }

    // Tek duyuru: personel bildirimden tıklayıp okur.
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _mediator.Send(new GetAnnouncementQuery(id));
        if (result is null) return NotFound();
        return Ok(result);
    }
}
