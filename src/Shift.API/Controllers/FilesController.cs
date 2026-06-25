using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Infrastructure.Storage;

namespace Shift.API.Controllers;

// YEREL MOCK dosya ucu (dev/demo). LocalFileStorage'ın ürettiği presigned URL'ler buraya
// işaret eder; imza (HMAC) + süre taşır → [AllowAnonymous] ama imzasız erişilemez
// (gerçek R2 presigned URL'leri de anonim ama imzalıdır). R2 moduna geçince bu uç
// kullanılmaz (URL'ler doğrudan R2'ye gider).
[ApiController]
[Route("api/files/local")]
[AllowAnonymous]
public class FilesController : ControllerBase
{
    private readonly LocalFileStorage _local;

    public FilesController(LocalFileStorage local)
    {
        _local = local;
    }

    // Presigned PUT hedefi: client dosyayı buraya yükler (imza doğrulanır).
    [HttpPut]
    public async Task<IActionResult> Upload(
        [FromQuery] string key, [FromQuery] long exp, [FromQuery] string sig,
        CancellationToken ct)
    {
        if (!_local.ValidateSignature(key, exp, sig))
            return StatusCode(StatusCodes.Status403Forbidden);

        await _local.SaveAsync(key, Request.Body, ct);
        return Ok();
    }

    // Presigned GET: client dosyayı buradan görüntüler (imza doğrulanır).
    [HttpGet]
    public IActionResult Download([FromQuery] string key, [FromQuery] long exp, [FromQuery] string sig)
    {
        if (!_local.ValidateSignature(key, exp, sig))
            return StatusCode(StatusCodes.Status403Forbidden);

        if (!_local.TryOpenRead(key, out var stream, out var contentType))
            return NotFound();

        return File(stream, contentType);
    }
}
