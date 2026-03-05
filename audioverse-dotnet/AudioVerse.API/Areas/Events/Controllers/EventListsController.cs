using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.API.Models.Requests.Events;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event lists — favorites, watched, location groups, custom collections.
    /// Supports user, organization, and league ownership with public/private visibility.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EventListsController(IMediator mediator) : ControllerBase
    {
        // ── List CRUD ──

        /// <summary>Gets all event lists for the current user.</summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMyLists()
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
            return Ok(await mediator.Send(new GetUserEventListsQuery(userId)));
        }

        /// <summary>Gets a specific event list by ID with items.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var list = await mediator.Send(new GetEventListByIdQuery(id));
            return list == null ? NotFound() : Ok(list);
        }

        /// <summary>Gets a list by its share token (public/shared access).</summary>
        [HttpGet("shared/{shareToken}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByShareToken(string shareToken)
        {
            var list = await mediator.Send(new GetEventListByShareTokenQuery(shareToken));
            return list == null ? NotFound() : Ok(list);
        }

        /// <summary>Gets all event lists for an organization.</summary>
        [HttpGet("organization/{organizationId:int}")]
        public async Task<IActionResult> GetByOrganization(int organizationId)
            => Ok(await mediator.Send(new GetOrganizationEventListsQuery(organizationId)));

        /// <summary>Gets all event lists for a league.</summary>
        [HttpGet("league/{leagueId:int}")]
        public async Task<IActionResult> GetByLeague(int leagueId)
            => Ok(await mediator.Send(new GetLeagueEventListsQuery(leagueId)));

        /// <summary>Gets public event lists with paging.</summary>
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublic([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
            => Ok(await mediator.Send(new GetPublicEventListsQuery(page, pageSize)));

        /// <summary>Creates a new event list.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventListRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
            var id = await mediator.Send(new CreateEventListCommand(
                req.Name, req.Description, req.Type, req.Visibility,
                req.OrganizationId == null && req.LeagueId == null ? userId : null,
                req.OrganizationId, req.LeagueId, req.IconKey, req.Color));
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }

        /// <summary>Updates an existing event list.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEventListRequest req)
        {
            var ok = await mediator.Send(new UpdateEventListCommand(
                id, req.Name, req.Description, req.Visibility,
                req.IconKey, req.Color, req.IsPinned, req.SortOrder));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Deletes an event list and all its items.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
            => await mediator.Send(new DeleteEventListCommand(id)) ? NoContent() : NotFound();

        // ── Items ──

        /// <summary>Adds an event to a list.</summary>
        [HttpPost("{listId:int}/events")]
        public async Task<IActionResult> AddEvent(int listId, [FromBody] AddEventToListRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
            var itemId = await mediator.Send(new AddEventToListCommand(listId, req.EventId, req.Note, req.Tags, userId));
            return itemId > 0 ? Ok(new { itemId }) : Conflict("Event already in list");
        }

        /// <summary>Removes an item from a list.</summary>
        [HttpDelete("items/{itemId:int}")]
        public async Task<IActionResult> RemoveItem(int itemId)
            => await mediator.Send(new RemoveEventFromListCommand(itemId)) ? NoContent() : NotFound();

        /// <summary>Updates a list item's note, tags, or order.</summary>
        [HttpPut("items/{itemId:int}")]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] UpdateEventListItemRequest req)
            => await mediator.Send(new UpdateEventListItemCommand(itemId, req.Note, req.Tags, req.SortOrder))
                ? NoContent() : NotFound();

        /// <summary>Checks if a specific event is in a list.</summary>
        [HttpGet("{listId:int}/events/{eventId:int}/exists")]
        public async Task<IActionResult> IsInList(int listId, int eventId)
            => Ok(new { exists = await mediator.Send(new IsEventInListQuery(listId, eventId)) });

        // ── Bulk operations ──

        /// <summary>Adds multiple events to a list at once.</summary>
        [HttpPost("{listId:int}/events/bulk")]
        public async Task<IActionResult> AddBulk(int listId, [FromBody] BulkEventIdsRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
            var added = await mediator.Send(new AddEventsBulkCommand(listId, req.EventIds, userId));
            return Ok(new { added });
        }

        /// <summary>Removes multiple events from a list at once.</summary>
        [HttpDelete("{listId:int}/events/bulk")]
        public async Task<IActionResult> RemoveBulk(int listId, [FromBody] BulkEventIdsRequest req)
        {
            var removed = await mediator.Send(new RemoveEventsBulkCommand(listId, req.EventIds));
            return Ok(new { removed });
        }

        /// <summary>Moves events from one list to another.</summary>
        [HttpPost("move")]
        public async Task<IActionResult> Move([FromBody] MoveEventsRequest req)
        {
            var moved = await mediator.Send(new MoveEventsCommand(req.SourceListId, req.TargetListId, req.EventIds));
            return Ok(new { moved });
        }

        /// <summary>Copies events from one list to another.</summary>
        [HttpPost("copy")]
        public async Task<IActionResult> Copy([FromBody] CopyEventsRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
            var copied = await mediator.Send(new CopyEventsCommand(req.SourceListId, req.TargetListId, req.EventIds, userId));
            return Ok(new { copied });
        }

        /// <summary>Reorders items within a list.</summary>
        [HttpPut("{listId:int}/reorder")]
        public async Task<IActionResult> Reorder(int listId, [FromBody] Dictionary<int, int> itemIdToOrder)
        {
            await mediator.Send(new ReorderEventListCommand(listId, itemIdToOrder));
            return NoContent();
        }

        // ── Favorites shortcut ──

        /// <summary>Toggles an event in the current user's favorites list. Returns true if added, false if removed.</summary>
        [HttpPost("favorites/toggle/{eventId:int}")]
        public async Task<IActionResult> ToggleFavorite(int eventId)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
            var isNowFavorite = await mediator.Send(new ToggleFavoriteEventCommand(userId, eventId));
            return Ok(new { isFavorite = isNowFavorite });
        }
    }
}
