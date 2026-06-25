using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Checklists.Create;
using Shift.Application.Features.Checklists.List;

namespace Shift.API.Controllers;

// Kontrol listesi ŞABLONLARI (tanım). Çalıştırmalar ayrı controller'da (ChecklistRuns).
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChecklistsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChecklistsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Şablon oluşturma: yönetici işi.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChecklistCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Şablon listesi: personel de görür (ne yapacağını bilmeli).
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int? type,
        [FromQuery] bool includeInactive = false)
    {
        var result = await _mediator.Send(new ListChecklistsQuery(type, includeInactive));
        return Ok(result);
    }
}
