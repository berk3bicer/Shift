using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Attachments.UploadUrl;
using Shift.Application.Features.Attachments.Confirm;
using Shift.Application.Features.Attachments.List;
using Shift.Domain.Entities;

namespace Shift.API.Controllers;

// Dosya/fotoğraf iliştirme akışı (presigned). Sıra: upload-url al → client doğrudan
// storage'a PUT → confirm (key'i kaydet) → list (indirme URL'leriyle). Personel kendi
// görevine/checklist işaretine kanıt fotoğrafı ekler.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner,Manager,Staff")]
public class AttachmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttachmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // 1) Presigned yükleme URL'i al (DB'ye yazmaz).
    [HttpPost("upload-url")]
    public async Task<IActionResult> UploadUrl([FromBody] CreateUploadUrlCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // 2) Yükleme bitince key'i kalıcı iliştirmeye bağla.
    [HttpPost]
    public async Task<IActionResult> Confirm([FromBody] ConfirmAttachmentCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // 3) Bir sahibin iliştirmelerini indirme URL'leriyle listele.
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] AttachmentOwnerType ownerType,
        [FromQuery] Guid ownerId)
    {
        var result = await _mediator.Send(new ListAttachmentsQuery(ownerType, ownerId));
        return Ok(result);
    }
}
