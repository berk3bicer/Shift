using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Overtime.Summary;
using Shift.Application.Features.Overtime.Close;
using Shift.Application.Features.Overtime.Records.List;
using Shift.Application.Features.Overtime.Records.Get;
using Shift.Application.Features.Overtime.Unlock;

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

    // Bir personelin bir dönemini KAPATIR (mesaiyi dondurur, bordroya hazır).
    // Sadece Owner — kapanış geri alınması zor bir işlem, en yüksek yetki.
    // Body: { "userId": "...", "from": "2026-06-01", "to": "2026-06-30" }
    [HttpPost("close")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Close(
        [FromBody] CloseOvertimePeriodCommand command,
        CancellationToken ct)
    {
        var recordId = await _mediator.Send(command, ct);
        return Ok(new { recordId });
    }

    // Kapanmış mesai kayıtlarını listeler (özet, haftalık kırılım YOK).
    // Owner + Manager. Tüm filtreler opsiyonel: ?userId=&from=&to=
    [HttpGet("records")]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> ListRecords(
        [FromQuery] Guid? userId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new ListOvertimeRecordsQuery(userId, from, to), ct);
        return Ok(result);
    }

    // Tek bir kapanmış mesai kaydının tam detayı (haftalık kırılım dahil).
    // Owner + Manager. Bulunamazsa 404.
    [HttpGet("records/{id:guid}")]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> GetRecord(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetOvertimeRecordQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // Kilitli bir mesai kaydının kilidini açar (düzeltme için). Kayıt silinmez.
    // Sadece Owner — kapanış kadar kritik bir işlem (bordro etkiler).
    [HttpPost("records/{id:guid}/unlock")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UnlockRecord(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new UnlockOvertimeRecordCommand(id), ct);
        return NoContent();
    }
}