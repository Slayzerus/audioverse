using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Media;
using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Infrastructure.ExternalApis.Tmdb;

namespace AudioVerse.API.Areas.MediaCatalog.Controllers
{
    /// <summary>
    /// TV shows / series catalog with TMDB integration, collections, and search.
    /// </summary>
    [ApiController]
    [Route("api/media/tv")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Produces("application/json")]
    [Tags("Media - TV Shows")]
    public class TvShowsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ITmdbClient? _tmdb;

        public TvShowsController(IMediator mediator, ITmdbClient? tmdb = null)
        {
            _mediator = mediator;
            _tmdb = tmdb;
        }

        /// <summary>Get a paged list of TV shows.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] string? query = null, [FromQuery] string? sortBy = null, [FromQuery] bool descending = false)
        {
            var (items, total) = await _mediator.Send(new GetTvShowsPagedQuery(page, pageSize, query, sortBy, descending));
            return Ok(new { items, total, page, pageSize });
        }

        /// <summary>Get a TV show by ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var s = await _mediator.Send(new GetTvShowByIdQuery(id));
            return s != null ? Ok(s) : NotFound();
        }

        /// <summary>Create a new TV show.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TvShow show)
        {
            var id = await _mediator.Send(new AddTvShowCommand(show));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update a TV show.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] TvShow show)
        {
            show.Id = id;
            return await _mediator.Send(new UpdateTvShowCommand(show)) ? Ok() : NotFound();
        }

        /// <summary>Delete a TV show.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id) =>
            await _mediator.Send(new DeleteTvShowCommand(id)) ? Ok() : NotFound();

        // ── TMDB Integration ──

        /// <summary>Search TV shows on TMDB.</summary>
        [HttpGet("tmdb/search")]
        public async Task<IActionResult> TmdbSearch([FromQuery] string query, [FromQuery] int limit = 20)
        {
            if (_tmdb == null) return StatusCode(503, new { error = "TMDB not configured. Set Tmdb:ApiKey." });
            return Ok(await _tmdb.SearchTvShowsAsync(query, limit));
        }

        /// <summary>Import a TV show from TMDB by ID.</summary>
        [HttpPost("tmdb/import/{tmdbId:int}")]
        public async Task<IActionResult> TmdbImport(int tmdbId)
        {
            if (_tmdb == null) return StatusCode(503, new { error = "TMDB not configured." });
            var details = await _tmdb.GetTvShowDetailsAsync(tmdbId);
            if (details == null) return NotFound(new { error = "TV show not found on TMDB." });

            var show = new TvShow
            {
                Title = details.Name,
                OriginalTitle = details.OriginalName,
                Description = details.Overview,
                FirstAirYear = int.TryParse(details.FirstAirDate?.Split('-').FirstOrDefault(), out var y1) ? y1 : null,
                LastAirYear = int.TryParse(details.LastAirDate?.Split('-').FirstOrDefault(), out var y2) ? y2 : null,
                SeasonCount = details.NumberOfSeasons,
                EpisodeCount = details.NumberOfEpisodes,
                Network = details.Networks.FirstOrDefault(),
                PosterUrl = details.PosterPath != null ? $"https://image.tmdb.org/t/p/w500{details.PosterPath}" : null,
                Status = details.Status,
                Rating = details.VoteAverage,
                Language = details.OriginalLanguage,
                TmdbId = details.Id,
                ImportedFrom = "tmdb"
            };

            var id = await _mediator.Send(new AddTvShowCommand(show));
            return CreatedAtAction(nameof(GetById), new { id }, show);
        }

        // ── Collections ──

        /// <summary>Create a TV show collection.</summary>
        [HttpPost("collections")]
        public async Task<IActionResult> CreateCollection([FromBody] TvShowCollection collection)
        {
            var id = await _mediator.Send(new AddTvShowCollectionCommand(collection));
            return CreatedAtAction(nameof(GetCollectionById), new { id }, new { Id = id });
        }

        /// <summary>Get a TV show collection by ID.</summary>
        [HttpGet("collections/{id:int}")]
        public async Task<IActionResult> GetCollectionById(int id, [FromQuery] bool includeChildren = false, [FromQuery] int maxDepth = 1)
        {
            var c = await _mediator.Send(new GetTvShowCollectionByIdQuery(id, includeChildren, maxDepth));
            return c != null ? Ok(c) : NotFound();
        }

        /// <summary>Get TV show collections by owner.</summary>
        [HttpGet("collections/owner/{ownerId:int}")]
        public async Task<IActionResult> GetCollectionsByOwner(int ownerId) =>
            Ok(await _mediator.Send(new GetTvShowCollectionsByOwnerQuery(ownerId)));

        /// <summary>Update a TV show collection.</summary>
        [HttpPut("collections/{id:int}")]
        public async Task<IActionResult> UpdateCollection(int id, [FromBody] TvShowCollection collection)
        {
            collection.Id = id;
            return await _mediator.Send(new UpdateTvShowCollectionCommand(collection)) ? Ok() : NotFound();
        }

        /// <summary>Delete a TV show collection.</summary>
        [HttpDelete("collections/{id:int}")]
        public async Task<IActionResult> DeleteCollection(int id) =>
            await _mediator.Send(new DeleteTvShowCollectionCommand(id)) ? Ok() : NotFound();

        /// <summary>Add a TV show to a collection.</summary>
        [HttpPost("collections/{collectionId:int}/shows")]
        public async Task<IActionResult> AddToCollection(int collectionId, [FromBody] TvShowCollectionTvShow item)
        {
            item.CollectionId = collectionId;
            var id = await _mediator.Send(new AddTvShowToCollectionCommand(item));
            return Ok(new { Id = id });
        }

        /// <summary>Remove a TV show from a collection.</summary>
        [HttpDelete("collections/shows/{id:int}")]
        public async Task<IActionResult> RemoveFromCollection(int id) =>
            await _mediator.Send(new RemoveTvShowFromCollectionCommand(id)) ? Ok() : NotFound();
    }
}
