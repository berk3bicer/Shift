using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Checklists.Create;
using Shift.Application.Features.Checklists.List;
using Shift.Application.Features.Checklists.Update;
using Shift.Application.Features.Checklists.Delete;

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

    // Şablon güncelleme (ad/tür/madde listesi replace): yönetici. URL'deki id otorite.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateChecklistCommand command)
    {
        await _mediator.Send(command with { Id = id });
        return NoContent();
    }

    // Şablon silme = soft-disable (IsActive=false; geçmiş çalıştırmalar korunur): yönetici.
    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteChecklistCommand(id));
        return NoContent();
    }
}
