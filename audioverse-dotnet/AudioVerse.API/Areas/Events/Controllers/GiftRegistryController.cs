using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Application.Queries.Wishlists;
using MediatR;
using System.Security.Claims;

using AudioVerse.API.Models.Requests.GiftRegistry;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Gift registries for events (weddings, birthdays) — with group contribution support.
/// </summary>
[Route("api/gift-registry")]
[ApiController]
public class GiftRegistryController(IMediator mediator) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>Get gift registries for the authenticated user (as owner).</summary>
    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyRegistries()
        => Ok(await mediator.Send(new GetMyGiftRegistriesQuery(GetUserId())));

    /// <summary>Get a gift registry by public share token.</summary>
    [HttpGet("shared/{token}")]
    public async Task<IActionResult> GetByShareToken(string token)
    {
        var result = await mediator.Send(new GetGiftRegistryByTokenQuery(token));
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Create a gift registry (optionally linked to an event).</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRegistryRequest req)
    {
        var reg = await mediator.Send(new CreateGiftRegistryCommand(GetUserId(), req.Name, req.Description, req.EventId));
        return Ok(new { reg.Id, reg.ShareToken });
    }

    /// <summary>Update a gift registry.</summary>
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateRegistryRequest req)
    {
        var result = await mediator.Send(new UpdateGiftRegistryCommand(id, GetUserId(), req.Name, req.Description, req.EventId));
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Toggle a gift registry active/inactive.</summary>
    [Authorize]
    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var result = await mediator.Send(new ToggleGiftRegistryCommand(id, GetUserId()));
        return result.HasValue ? Ok(new { id = result.Value.Id, isActive = result.Value.IsActive }) : NotFound();
    }

    /// <summary>Delete a gift registry (cascading).</summary>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
        => await mediator.Send(new DeleteGiftRegistryCommand(id, GetUserId())) ? NoContent() : NotFound();

    /// <summary>Add an item to a gift registry.</summary>
    [Authorize]
    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddItem(int id, [FromBody] GiftItemRequest req)
    {
        var item = await mediator.Send(new AddGiftRegistryItemCommand(
            id, GetUserId(), req.Name, req.Description, req.ImageUrl, req.ExternalUrl,
            req.TargetAmount, req.Currency, req.MaxContributors, req.SortOrder));
        return item != null ? Ok(new { item.Id }) : NotFound();
    }

    /// <summary>Update a gift registry item.</summary>
    [Authorize]
    [HttpPut("{id}/items/{itemId}")]
    public async Task<IActionResult> UpdateItem(int id, int itemId, [FromBody] GiftItemRequest req)
    {
        var item = await mediator.Send(new UpdateGiftRegistryItemCommand(
            id, itemId, GetUserId(), req.Name, req.Description, req.ImageUrl, req.ExternalUrl,
            req.TargetAmount, req.Currency, req.MaxContributors, req.SortOrder));
        return item != null ? Ok(item) : NotFound();
    }

    /// <summary>Delete a gift registry item.</summary>
    [Authorize]
    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> RemoveItem(int id, int itemId)
        => await mediator.Send(new DeleteGiftRegistryItemCommand(id, itemId, GetUserId())) ? NoContent() : NotFound();

    /// <summary>Contribute to a gift (guest — no login required).</summary>
    [HttpPost("items/{itemId}/contribute")]
    public async Task<IActionResult> Contribute(int itemId, [FromBody] ContributionRequest req)
    {
        int? userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : null;
        var result = await mediator.Send(new ContributeToGiftCommand(
            itemId, userId, req.GuestName, req.GuestEmail, req.Amount, req.Message, req.IsAnonymous));
        if (!result.HasValue) return BadRequest("Gift is already fully reserved or does not exist");
        return Ok(new { id = result.Value.ContributionId, isFullyReserved = result.Value.IsFullyReserved });
    }

    /// <summary>Remove your contribution / reservation.</summary>
    [HttpDelete("contributions/{contributionId}")]
    public async Task<IActionResult> RemoveContribution(int contributionId)
    {
        int? userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : null;
        bool isAdmin = User.IsInRole("Admin");
        return await mediator.Send(new RemoveContributionCommand(contributionId, userId, isAdmin)) ? NoContent() : NotFound();
    }
}
