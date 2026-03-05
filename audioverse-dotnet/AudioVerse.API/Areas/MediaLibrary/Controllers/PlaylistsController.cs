using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Models.Requests.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers
{
    [ApiController]
    [Route("api/playlists")]
    [Authorize]
    public class PlaylistsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public PlaylistsController(IMediator mediator) => _mediator = mediator;

        /// <summary>List all playlists.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _mediator.Send(new GetAllPlaylistsQuery()));

        /// <summary>Get a playlist by ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] bool includeChildren = false, [FromQuery] int maxDepth = 1)
        {
            var p = await _mediator.Send(new GetPlaylistByIdQuery(id, includeChildren, maxDepth));
            return p != null ? Ok(p) : NotFound();
        }

        /// <summary>Create a new playlist.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Playlist playlist)
        {
            var id = await _mediator.Send(new CreatePlaylistCommand(playlist));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update playlist metadata.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Playlist playlist)
        {
            playlist.Id = id;
            var ok = await _mediator.Send(new UpdatePlaylistCommand(playlist));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a playlist.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _mediator.Send(new DeletePlaylistCommand(id));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a song to a playlist.</summary>
        [HttpPost("{id:int}/items")]
        public async Task<IActionResult> AddItem(int id, [FromBody] AddPlaylistItemDto dto)
        {
            var itemId = await _mediator.Send(new AddPlaylistItemCommand(id, dto.SongId, dto.OrderNumber));
            return Ok(new { Id = itemId });
        }

        /// <summary>Remove an item from a playlist.</summary>
        [HttpDelete("items/{itemId:int}")]
        public async Task<IActionResult> RemoveItem(int itemId)
        {
            var ok = await _mediator.Send(new RemovePlaylistItemCommand(itemId));
            return ok ? NoContent() : NotFound();
        }
    }
}
