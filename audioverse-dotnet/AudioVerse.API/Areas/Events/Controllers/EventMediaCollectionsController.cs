using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event media collections (photo/video albums).
    /// </summary>
    [ApiController]
    [Route("api/events")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Events - Media Collections")]
    public class EventMediaCollectionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EventMediaCollectionsController(IMediator mediator) => _mediator = mediator;

        /// <summary>Create a media collection (album) for an event.</summary>
        [HttpPost("{eventId:int}/media-collections")]
        public async Task<IActionResult> AddMediaCollection(int eventId, [FromBody] AudioVerse.Domain.Entities.Events.EventMediaCollection collection)
        {
            collection.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddMediaCollectionCommand(collection));
            return Created($"/api/events/{eventId}/media-collections/{id}", new { Id = id });
        }

        /// <summary>Get media collections for an event (ordered).</summary>
        [HttpGet("{eventId:int}/media-collections")]
        public async Task<IActionResult> GetMediaCollections(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetMediaCollectionsByEventQuery(eventId)));

        /// <summary>Get a media collection with its photos and videos.</summary>
        [HttpGet("{eventId:int}/media-collections/{id:int}")]
        public async Task<IActionResult> GetMediaCollection(int eventId, int id)
        {
            var collection = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetMediaCollectionByIdQuery(id));
            return collection != null ? Ok(collection) : NotFound();
        }

        /// <summary>Update a media collection.</summary>
        [HttpPut("{eventId:int}/media-collections/{id:int}")]
        public async Task<IActionResult> UpdateMediaCollection(int eventId, int id, [FromBody] AudioVerse.Domain.Entities.Events.EventMediaCollection collection)
        {
            collection.Id = id;
            collection.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateMediaCollectionCommand(collection)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a media collection.</summary>
        [HttpDelete("{eventId:int}/media-collections/{id:int}")]
        public async Task<IActionResult> DeleteMediaCollection(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteMediaCollectionCommand(id)) ? NoContent() : NotFound();
    }
}
