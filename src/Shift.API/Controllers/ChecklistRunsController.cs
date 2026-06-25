using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.ChecklistRuns.Start;
using Shift.Application.Features.ChecklistRuns.Check;
using Shift.Application.Features.ChecklistRuns.Get;
using Shift.Application.Features.ChecklistRuns.List;

namespace Shift.API.Controllers;

// Kontrol listesi ÇALIŞTIRMALARI (doldurulmuş örnek). Personel açılışı başlatır ve
// maddeleri işaretler → start/check personele açık; liste (rapor) yöneticide.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChecklistRunsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChecklistRunsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Çalıştırma başlat (şablondan snapshot). Personel de başlatabilir (açılışı yapan kişi).
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpPost]
    public async Task<IActionResult> Start([FromBody] StartChecklistRunCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Madde işaretle/işareti kaldır. Personel kendi açılış maddelerini işaretler.
    // URL'deki runId + itemId otorite; gövde yalnız durum + not.
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpPost("{runId}/items/{itemId}/check")]
    public async Task<IActionResult> Check(Guid runId, Guid itemId, [FromBody] CheckItemRequest body)
    {
        var result = await _mediator.Send(
            new CheckChecklistItemCommand(runId, itemId, body.IsChecked, body.Note));
        return Ok(result);
    }

    // Tek çalıştırma detayı (kim/ne zaman işaretledi) — yönetici raporu + personel görünümü.
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpGet("{runId}")]
    public async Task<IActionResult> Get(Guid runId)
    {
        var result = await _mediator.Send(new GetChecklistRunQuery(runId));
        if (result is null) return NotFound();
        return Ok(result);
    }

    // Çalıştırma listesi (şube takibi): "bugün açılış yapıldı mı?" — yönetici.
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid branchId,
        [FromQuery] int? type,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate)
    {
        var result = await _mediator.Send(
            new ListChecklistRunsQuery(branchId, type, fromDate, toDate));
        return Ok(result);
    }
}

// Check gövdesi: işaret durumu + opsiyonel not. runId/itemId URL'den (otorite).
public record CheckItemRequest(bool IsChecked, string? Note);
