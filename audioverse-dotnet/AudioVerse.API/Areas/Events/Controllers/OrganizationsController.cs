using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Organizations — top-level grouping for leagues (e.g. FIFA, NBA, Netflix).
/// </summary>
[ApiController]
[Route("api/organizations")]
[Microsoft.AspNetCore.Authorization.Authorize]
[Produces("application/json")]
[Tags("Events - Organizations")]
public class OrganizationsController(IMediator mediator) : ControllerBase
{
    /// <summary>Get a paged list of organizations.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await mediator.Send(new GetOrganizationsQuery(page, pageSize));
        return Ok(new { items, total, page, pageSize });
    }

    /// <summary>Get an organization by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var org = await mediator.Send(new GetOrganizationByIdQuery(id));
        return org != null ? Ok(org) : NotFound();
    }

    /// <summary>Create a new organization.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Organization org)
    {
        var id = await mediator.Send(new CreateOrganizationCommand(org));
        return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
    }

    /// <summary>Update an organization.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Organization org)
    {
        org.Id = id;
        return await mediator.Send(new UpdateOrganizationCommand(org)) ? Ok() : NotFound();
    }

    /// <summary>Delete an organization.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await mediator.Send(new DeleteOrganizationCommand(id)) ? Ok() : NotFound();
}
