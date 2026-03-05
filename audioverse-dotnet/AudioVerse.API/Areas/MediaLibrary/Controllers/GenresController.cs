using AudioVerse.Application.Queries.Audio;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OutputCaching;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers
{
    [ApiController]
    [Route("api/genres")]
    [AllowAnonymous]
    public class GenresController : ControllerBase
    {
        private readonly IMediator _mediator;
        public GenresController(IMediator mediator) => _mediator = mediator;

        /// <summary>List all active music genres.</summary>
        [HttpGet]
        [OutputCache(PolicyName = "CacheLong")]
        public async Task<IActionResult> GetAll() => Ok(await _mediator.Send(new GetActiveGenresQuery()));

        /// <summary>Get a genre by ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var g = await _mediator.Send(new GetGenreByIdQuery(id));
            return g != null ? Ok(g) : NotFound();
        }
    }
}
