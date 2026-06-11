using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shift.Application.Features.Branches.Create;
using Shift.Application.Features.Branches.List;

namespace Shift.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Tüm endpoint'ler giriş ister (token zorunlu)
public class BranchesController : ControllerBase
{
    private readonly IMediator _mediator;

    public BranchesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Şube oluşturma: yalnızca işletme sahibi
    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBranchCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // Şubeleri listeleme: sahip veya yönetici
    [Authorize(Roles = "Owner,Manager")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var result = await _mediator.Send(new ListBranchesQuery());
        return Ok(result);
    }
}