using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Media;
using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Infrastructure.ExternalApis.Tmdb;

namespace AudioVerse.API.Areas.MediaCatalog.Controllers
{
    /// <summary>
    /// Movies catalog with TMDB integration, collections, and search.
    /// </summary>
    [ApiController]
    [Route("api/media/movies")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Produces("application/json")]
    [Tags("Media - Movies")]
    public class MoviesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ITmdbClient? _tmdb;

        public MoviesController(IMediator mediator, ITmdbClient? tmdb = null)
        {
            _mediator = mediator;
            _tmdb = tmdb;
        }

        // ── CRUD ──

        /// <summary>Get a paged list of movies.</summary>
        [HttpGet]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] string? query = null, [FromQuery] string? sortBy = null, [FromQuery] bool descending = false)
        {
            var (items, total) = await _mediator.Send(new GetMoviesPagedQuery(page, pageSize, query, sortBy, descending));
            return Ok(new { items, total, page, pageSize });
        }

        /// <summary>Get a movie by ID.</summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(Movie), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(int id)
        {
            var m = await _mediator.Send(new GetMovieByIdQuery(id));
            return m != null ? Ok(m) : NotFound();
        }

        /// <summary>Create a new movie.</summary>
        [HttpPost]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] Movie movie)
        {
            var id = await _mediator.Send(new AddMovieCommand(movie));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update a movie.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Movie movie)
        {
            movie.Id = id;
            return await _mediator.Send(new UpdateMovieCommand(movie)) ? Ok() : NotFound();
        }

        /// <summary>Delete a movie.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id) =>
            await _mediator.Send(new DeleteMovieCommand(id)) ? Ok() : NotFound();

        // ── TMDB Integration ──

        /// <summary>Search movies on TMDB.</summary>
        [HttpGet("tmdb/search")]
        public async Task<IActionResult> TmdbSearch([FromQuery] string query, [FromQuery] int limit = 20)
        {
            if (_tmdb == null) return StatusCode(503, new { error = "TMDB not configured. Set Tmdb:ApiKey." });
            return Ok(await _tmdb.SearchMoviesAsync(query, limit));
        }

        /// <summary>Import a movie from TMDB by ID.</summary>
        [HttpPost("tmdb/import/{tmdbId:int}")]
        public async Task<IActionResult> TmdbImport(int tmdbId)
        {
            if (_tmdb == null) return StatusCode(503, new { error = "TMDB not configured." });
            var details = await _tmdb.GetMovieDetailsAsync(tmdbId);
            if (details == null) return NotFound(new { error = "Movie not found on TMDB." });

            var movie = new Movie
            {
                Title = details.Title,
                OriginalTitle = details.OriginalTitle,
                Description = details.Overview,
                RuntimeMinutes = details.Runtime,
                ReleaseYear = int.TryParse(details.ReleaseDate?.Split('-').FirstOrDefault(), out var y) ? y : null,
                Director = details.Directors.FirstOrDefault()?.Name,
                PosterUrl = details.PosterPath != null ? $"https://image.tmdb.org/t/p/w500{details.PosterPath}" : null,
                Rating = details.VoteAverage,
                Language = details.OriginalLanguage,
                TmdbId = details.Id,
                ImdbId = details.ImdbId,
                ImportedFrom = "tmdb"
            };

            var id = await _mediator.Send(new AddMovieCommand(movie));
            return CreatedAtAction(nameof(GetById), new { id }, movie);
        }

        // ── Collections ──

        /// <summary>Create a movie collection.</summary>
        [HttpPost("collections")]
        public async Task<IActionResult> CreateCollection([FromBody] MovieCollection collection)
        {
            var id = await _mediator.Send(new AddMovieCollectionCommand(collection));
            return CreatedAtAction(nameof(GetCollectionById), new { id }, new { Id = id });
        }

        /// <summary>Get a movie collection by ID.</summary>
        [HttpGet("collections/{id:int}")]
        public async Task<IActionResult> GetCollectionById(int id, [FromQuery] bool includeChildren = false, [FromQuery] int maxDepth = 1)
        {
            var c = await _mediator.Send(new GetMovieCollectionByIdQuery(id, includeChildren, maxDepth));
            return c != null ? Ok(c) : NotFound();
        }

        /// <summary>Get movie collections by owner.</summary>
        [HttpGet("collections/owner/{ownerId:int}")]
        public async Task<IActionResult> GetCollectionsByOwner(int ownerId) =>
            Ok(await _mediator.Send(new GetMovieCollectionsByOwnerQuery(ownerId)));

        /// <summary>Update a movie collection.</summary>
        [HttpPut("collections/{id:int}")]
        public async Task<IActionResult> UpdateCollection(int id, [FromBody] MovieCollection collection)
        {
            collection.Id = id;
            return await _mediator.Send(new UpdateMovieCollectionCommand(collection)) ? Ok() : NotFound();
        }

        /// <summary>Delete a movie collection.</summary>
        [HttpDelete("collections/{id:int}")]
        public async Task<IActionResult> DeleteCollection(int id) =>
            await _mediator.Send(new DeleteMovieCollectionCommand(id)) ? Ok() : NotFound();

        /// <summary>Add a movie to a collection.</summary>
        [HttpPost("collections/{collectionId:int}/movies")]
        public async Task<IActionResult> AddToCollection(int collectionId, [FromBody] MovieCollectionMovie item)
        {
            item.CollectionId = collectionId;
            var id = await _mediator.Send(new AddMovieToCollectionCommand(item));
            return Ok(new { Id = id });
        }

        /// <summary>Remove a movie from a collection.</summary>
        [HttpDelete("collections/movies/{id:int}")]
        public async Task<IActionResult> RemoveFromCollection(int id) =>
            await _mediator.Send(new RemoveMovieFromCollectionCommand(id)) ? Ok() : NotFound();
    }
}
