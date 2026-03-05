using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event collages — 2D/3D compositions of photos and videos.
    /// </summary>
    [ApiController]
    [Route("api/events")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Events - Collages")]
    public class EventCollagesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EventCollagesController(IMediator mediator) => _mediator = mediator;

        /// <summary>Create a collage for an event.</summary>
        [HttpPost("{eventId:int}/collages")]
        public async Task<IActionResult> AddCollage(int eventId, [FromBody] AudioVerse.Domain.Entities.Events.EventCollage collage)
        {
            collage.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddCollageCommand(collage));
            return Created($"/api/events/{eventId}/collages/{id}", new { Id = id });
        }

        /// <summary>Get collages for an event.</summary>
        [HttpGet("{eventId:int}/collages")]
        public async Task<IActionResult> GetCollages(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetCollagesByEventQuery(eventId)));

        /// <summary>Get collage with all items (photos/videos with positions).</summary>
        [HttpGet("{eventId:int}/collages/{id:int}")]
        public async Task<IActionResult> GetCollage(int eventId, int id)
        {
            var collage = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetCollageByIdQuery(id));
            return collage != null ? Ok(collage) : NotFound();
        }

        /// <summary>Update collage settings.</summary>
        [HttpPut("{eventId:int}/collages/{id:int}")]
        public async Task<IActionResult> UpdateCollage(int eventId, int id, [FromBody] AudioVerse.Domain.Entities.Events.EventCollage collage)
        {
            collage.Id = id;
            collage.EventId = eventId;
            collage.UpdatedAt = DateTime.UtcNow;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateCollageCommand(collage)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a collage.</summary>
        [HttpDelete("{eventId:int}/collages/{id:int}")]
        public async Task<IActionResult> DeleteCollage(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteCollageCommand(id)) ? NoContent() : NotFound();

        /// <summary>Add item (photo or video) to a collage.</summary>
        [HttpPost("{eventId:int}/collages/{collageId:int}/items")]
        public async Task<IActionResult> AddCollageItem(int eventId, int collageId, [FromBody] AudioVerse.Domain.Entities.Events.EventCollageItem item)
        {
            item.CollageId = collageId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddCollageItemCommand(item));
            return Created($"/api/events/{eventId}/collages/{collageId}/items/{id}", new { Id = id });
        }

        /// <summary>Update collage item position/size/filters.</summary>
        [HttpPut("{eventId:int}/collages/{collageId:int}/items/{itemId:int}")]
        public async Task<IActionResult> UpdateCollageItem(int eventId, int collageId, int itemId, [FromBody] AudioVerse.Domain.Entities.Events.EventCollageItem item)
        {
            item.Id = itemId;
            item.CollageId = collageId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateCollageItemCommand(item)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Remove item from a collage.</summary>
        [HttpDelete("{eventId:int}/collages/{collageId:int}/items/{itemId:int}")]
        public async Task<IActionResult> DeleteCollageItem(int eventId, int collageId, int itemId)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteCollageItemCommand(itemId)) ? NoContent() : NotFound();
    }
}
