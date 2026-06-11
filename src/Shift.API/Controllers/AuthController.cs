using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Shift.Application.Features.Auth.Register;
using Shift.Application.Features.Auth.Login;
using Shift.Application.Features.Auth.Refresh;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
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
    public IActionResult Me()
    {
        var userId = User.FindFirst("userId")?.Value;
        var tenantId = User.FindFirst("tenantId")?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

        return Ok(new { userId, tenantId, name, roles });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}