using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Application.Queries.Wishlists;
using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.API.Models.Requests.Wishlists;
using MediatR;
using System.Security.Claims;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Wishlist management (board games, video games, movies, custom) + Steam synchronization.
/// </summary>
[Route("api/wishlists")]
[ApiController]
public class WishlistController(IMediator mediator) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>Get all wishlists for the authenticated user.</summary>
    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyWishlists()
        => Ok(await mediator.Send(new GetMyWishlistsQuery(GetUserId())));

    /// <summary>Get a wishlist by ID (owner or public).</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetWishlist(int id)
    {
        int? userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : null;
        var result = await mediator.Send(new GetWishlistQuery(id, userId));
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Get a wishlist by public share token (link sharing).</summary>
    [HttpGet("shared/{token}")]
    public async Task<IActionResult> GetByShareToken(string token)
    {
        var result = await mediator.Send(new GetWishlistByTokenQuery(token));
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Create a new wishlist.</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWishlistRequest req)
    {
        var wishlist = await mediator.Send(new CreateWishlistCommand(GetUserId(), req.Name, req.Description, req.IsPublic));
        return Ok(new { wishlist.Id, wishlist.ShareToken });
    }

    /// <summary>Update a wishlist.</summary>
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateWishlistRequest req)
    {
        var result = await mediator.Send(new UpdateWishlistCommand(id, GetUserId(), req.Name, req.Description, req.IsPublic));
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Delete a wishlist (cascading items).</summary>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
        => await mediator.Send(new DeleteWishlistCommand(id, GetUserId())) ? NoContent() : NotFound();

    /// <summary>Add an item to a wishlist.</summary>
    [Authorize]
    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddItem(int id, [FromBody] WishlistItemRequest req)
    {
        var item = await mediator.Send(new AddWishlistItemCommand(
            id, GetUserId(), req.ItemType, req.Name, req.Description, req.ImageUrl, req.ExternalUrl,
            req.EstimatedPrice, req.Currency, req.Priority, req.SortOrder,
            req.BoardGameId, req.VideoGameId, req.SteamAppId, req.BggId, req.Notes));
        return item != null ? Ok(new { item.Id }) : NotFound();
    }

    /// <summary>Update a wishlist item.</summary>
    [Authorize]
    [HttpPut("{id}/items/{itemId}")]
    public async Task<IActionResult> UpdateItem(int id, int itemId, [FromBody] WishlistItemRequest req)
    {
        var item = await mediator.Send(new UpdateWishlistItemCommand(
            id, itemId, GetUserId(), req.Name, req.Description, req.ImageUrl, req.ExternalUrl,
            req.EstimatedPrice, req.Currency, req.Priority, req.SortOrder,
            req.BoardGameId, req.VideoGameId, req.SteamAppId, req.BggId, req.Notes, req.IsAcquired));
        return item != null ? Ok(item) : NotFound();
    }

    /// <summary>Toggle item as acquired / purchased.</summary>
    [Authorize]
    [HttpPatch("{id}/items/{itemId}/acquired")]
    public async Task<IActionResult> ToggleAcquired(int id, int itemId)
    {
        var result = await mediator.Send(new ToggleAcquiredCommand(id, itemId, GetUserId()));
        return result.HasValue ? Ok(new { id = result.Value.Id, isAcquired = result.Value.IsAcquired }) : NotFound();
    }

    /// <summary>Delete a wishlist item.</summary>
    [Authorize]
    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> RemoveItem(int id, int itemId)
        => await mediator.Send(new DeleteWishlistItemCommand(id, itemId, GetUserId())) ? NoContent() : NotFound();

    /// <summary>Synchronize a wishlist with Steam.</summary>
    [Authorize]
    [HttpPost("{id}/sync/steam")]
    public async Task<IActionResult> SyncSteamWishlist(int id, [FromQuery] string steamId)
    {
        if (string.IsNullOrWhiteSpace(steamId)) return BadRequest("steamId is required");
        try
        {
            var (imported, total) = await mediator.Send(new SyncSteamWishlistCommand(id, GetUserId(), steamId));
            return Ok(new { imported, total });
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return NotFound(ex.Message); }
    }

    }
