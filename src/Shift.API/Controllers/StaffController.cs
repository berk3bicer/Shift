using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Staff.Create;
using Shift.Application.Features.Staff.List;
using Shift.Application.Features.Staff.ResendInvite;

namespace Shift.API.Controllers;

// İşletme personeli (mevcut tenant'a ekleme + listeleme). Davet/onboarding çekirdeği.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner,Manager")]
public class StaffController : ControllerBase
{
    private readonly IMediator _mediator;

    public StaffController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Personel ekle: yeni tenant açmaz, mevcut işletmeye User+rol+şube(+pozisyon) ekler.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Ekip listesi (atama dropdown'ları + roster).
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await _mediator.Send(new ListStaffQuery());
        return Ok(result);
    }

    // Daveti tekrar gönder (yalnız davet-bekleyen/pasif kullanıcıya; eski linkler iptal olur).
    [HttpPost("{id:guid}/resend-invite")]
    public async Task<IActionResult> ResendInvite(Guid id)
    {
        await _mediator.Send(new ResendInviteCommand(id));
        return Ok(new { message = "Davet e-postası yeniden gönderildi." });
    }
}
