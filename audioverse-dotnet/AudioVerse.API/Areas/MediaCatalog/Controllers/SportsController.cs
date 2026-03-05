using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Media;
using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Infrastructure.ExternalApis.TheSportsDb;

namespace AudioVerse.API.Areas.MediaCatalog.Controllers
{
    /// <summary>
    /// Sport activities catalog with TheSportsDB integration — running, cycling, climbing, team sports, upcoming events.
    /// </summary>
    [ApiController]
    [Route("api/media/sports")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Produces("application/json")]
    [Tags("Media - Sports")]
    public class SportsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ITheSportsDbClient? _sportsDb;

        public SportsController(IMediator mediator, ITheSportsDbClient? sportsDb = null)
        {
            _mediator = mediator;
            _sportsDb = sportsDb;
        }

        /// <summary>Get a paged list of sport activities.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] string? query = null, [FromQuery] string? sortBy = null, [FromQuery] bool descending = false)
        {
            var (items, total) = await _mediator.Send(new GetSportsPagedQuery(page, pageSize, query, sortBy, descending));
            return Ok(new { items, total, page, pageSize });
        }

        /// <summary>Get a sport activity by ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var s = await _mediator.Send(new GetSportByIdQuery(id));
            return s != null ? Ok(s) : NotFound();
        }

        /// <summary>Create a new sport activity.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SportActivity sport)
        {
            var id = await _mediator.Send(new AddSportCommand(sport));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update a sport activity.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SportActivity sport)
        {
            sport.Id = id;
            return await _mediator.Send(new UpdateSportCommand(sport)) ? Ok() : NotFound();
        }

        /// <summary>Delete a sport activity.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id) =>
            await _mediator.Send(new DeleteSportCommand(id)) ? Ok() : NotFound();

        // ── TheSportsDB Integration ──

        /// <summary>Search sports teams on TheSportsDB.</summary>
        [HttpGet("thesportsdb/search")]
        public async Task<IActionResult> SportsDbSearch([FromQuery] string query)
        {
            if (_sportsDb == null) return StatusCode(503, new { error = "TheSportsDB client not available." });
            return Ok(await _sportsDb.SearchSportsAsync(query));
        }

        /// <summary>Get all leagues from TheSportsDB.</summary>
        [HttpGet("thesportsdb/leagues")]
        public async Task<IActionResult> SportsDbLeagues()
        {
            if (_sportsDb == null) return StatusCode(503, new { error = "TheSportsDB client not available." });
            return Ok(await _sportsDb.GetAllLeaguesAsync());
        }

        /// <summary>Get upcoming sporting events for a league from TheSportsDB.</summary>
        [HttpGet("thesportsdb/upcoming/{leagueId:int}")]
        public async Task<IActionResult> SportsDbUpcoming(int leagueId)
        {
            if (_sportsDb == null) return StatusCode(503, new { error = "TheSportsDB client not available." });
            return Ok(await _sportsDb.GetUpcomingEventsAsync(leagueId));
        }
    }
}
