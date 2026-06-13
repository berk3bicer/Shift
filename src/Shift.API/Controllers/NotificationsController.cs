using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Notifications.List;
using Shift.Application.Features.Notifications.MarkRead;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Kendi bildirimlerim (UserId token'dan). Login olan herkes.
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await _mediator.Send(new ListNotificationsQuery());
        return Ok(result);
    }

    // Bir bildirimi okundu işaretle. Sadece kendi bildirimini (handler'da kontrol).
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var result = await _mediator.Send(new MarkNotificationReadCommand(id));
        return Ok(result);
    }
}