using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/genres")]
    [Authorize(Roles = "Admin")]
    public class GenresAdminController : ControllerBase
    {
        private readonly IMediator _mediator;
        public GenresAdminController(IMediator mediator) => _mediator = mediator;

        /// <summary>List all active genres (admin).</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _mediator.Send(new GetActiveGenresQuery()));

        /// <summary>Get a genre by ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var g = await _mediator.Send(new GetGenreByIdQuery(id));
            return g != null ? Ok(g) : NotFound();
        }

        /// <summary>Create a new genre.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AudioVerse.Domain.Entities.Audio.MusicGenre genre)
        {
            var id = await _mediator.Send(new CreateGenreCommand(genre));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update a genre.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] AudioVerse.Domain.Entities.Audio.MusicGenre genre)
        {
            genre.Id = id;
            var ok = await _mediator.Send(new UpdateGenreCommand(genre));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a genre.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _mediator.Send(new DeleteGenreCommand(id));
            return ok ? NoContent() : NotFound();
        }
    }
}
