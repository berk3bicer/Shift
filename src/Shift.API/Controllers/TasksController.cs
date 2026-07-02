using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Tasks.Create;
using Shift.Application.Features.Tasks.Update;
using Shift.Application.Features.Tasks.Delete;
using Shift.Application.Features.Tasks.List;
using Shift.Application.Features.Tasks.Mine;
using Shift.Application.Features.Tasks.Move;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public TasksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Görev oluşturma/atama: yönetici işi.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Pano listesi: sahip/yönetici tüm panoyu görür. (Personel görünümü ileride
    // "bana atananlar" ile ayrı uçtan; şimdilik yönetim panosu.)
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid branchId,
        [FromQuery] int? status,
        [FromQuery] Guid? assignedUserId)
    {
        var result = await _mediator.Send(new ListTasksQuery(branchId, status, assignedUserId));
        return Ok(result);
    }

    // Personele ATANMIŞ görevler (kendi panosu). "Görevi tamamla" (move) zaten Staff'a
    // açıktı ama listeleme değildi — bu uç o asimetriyi kapatır. Owner/Manager pano
    // ucundan AYRI: yetki [Authorize], veri handler'da JWT userId ile sınırlı.
    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> Mine([FromQuery] int? status)
    {
        var result = await _mediator.Send(new MyTasksQuery(status));
        return Ok(result);
    }

    // Görev içeriği/atama güncelleme: yönetici işi. URL'deki id otorite.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskCommand command)
    {
        await _mediator.Send(command with { Id = id });
        return NoContent();
    }

    // Görev silme: yönetici işi.
    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteTaskCommand(id));
        return NoContent();
    }

    // Kanban sütun taşıma (state machine). Personel de kendi görevini ilerletebilir
    // → Owner/Manager/Staff hepsi. Body: { "newStatus": 1 } (TaskItemStatus).
    [Authorize(Roles = "Owner,Manager,Staff")]
    [HttpPost("{id}/move")]
    public async Task<IActionResult> Move(Guid id, [FromBody] MoveTaskRequest body)
    {
        var result = await _mediator.Send(new MoveTaskCommand(id, body.NewStatus));
        return Ok(result);
    }
}

// Move gövdesi: yalnızca hedef durum. Id URL'den gelir (otorite).
public record MoveTaskRequest(Shift.Domain.Entities.TaskItemStatus NewStatus);
