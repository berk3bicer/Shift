using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Shift.Application.Common.Interfaces;
using Shift.Application.Features.Auth.Register;
using Shift.Application.Features.Auth.Login;
using Shift.Application.Features.Auth.Refresh;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IShiftDbContext _db;

    public AuthController(IMediator mediator, IShiftDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst("userId")?.Value;
        var tenantId = User.FindFirst("tenantId")?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

        // Birincil şube (clock-in için). Veri modeli çoğa-çok (UserBranch) ama pratikte
        // Staff tek şubede — ilk atanan şubeyi (CreatedAt) deterministik döndürürüz.
        // Owner UserBranch'te yer almaz → null (Owner zaten şube seçiciyi kullanır).
        // Salt-okuma projeksiyon; şema değişmez (migration yok). Tenant filtresi otomatik.
        Guid? branchId = null;
        if (Guid.TryParse(userId, out var uid))
        {
            branchId = await _db.UserBranches
                .Where(ub => ub.UserId == uid)
                .OrderBy(ub => ub.CreatedAt).ThenBy(ub => ub.Id)
                .Select(ub => (Guid?)ub.BranchId)
                .FirstOrDefaultAsync();
        }

        return Ok(new { userId, tenantId, name, roles, branchId });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}