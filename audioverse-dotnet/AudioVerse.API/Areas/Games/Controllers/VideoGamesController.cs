using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Entities.Games;

namespace AudioVerse.API.Areas.Games.Controllers
{
    /// <summary>
    /// Couch/party video games catalog with Steam integration.
    /// </summary>
    [ApiController]
    [Route("api/games/video")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Produces("application/json")]
    [Tags("Games - Couch Games")]
    public class VideoGamesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ISteamClient? _steam;
        private readonly AudioVerse.Infrastructure.ExternalApis.Igdb.IIgdbClient? _igdb;

        public VideoGamesController(IMediator mediator, ISteamClient? steam = null, AudioVerse.Infrastructure.ExternalApis.Igdb.IIgdbClient? igdb = null)
        {
            _mediator = mediator;
            _steam = steam;
            _igdb = igdb;
        }

        /// <summary>
        /// Get video games with optional filtering, sorting, and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] AudioVerse.Application.Models.Requests.Games.GameCatalogFilterRequest filter)
        {
            if (filter.Page < 1 && string.IsNullOrEmpty(filter.Query) && !filter.MinPlayers.HasValue && !filter.MaxPlayers.HasValue)
                return Ok(await _mediator.Send(new GetAllVideoGamesQuery()));
            return Ok(await _mediator.Send(new AudioVerse.Application.Queries.Games.GetVideoGamesPagedQuery(filter)));
        }

        /// <summary>
        /// Get a video game by ID.
        /// </summary>
        /// <param name="id">Game ID</param>
        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var g = await _mediator.Send(new GetVideoGameByIdQuery(id));
            return g != null ? Ok(g) : NotFound();
        }

        /// <summary>
        /// Add a new video game to the catalog.
        /// </summary>
        /// <param name="game">Game data</param>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] VideoGame game)
        {
            if (game == null) return BadRequest();
            var id = await _mediator.Send(new AddVideoGameCommand(game));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>
        /// Update a video game.
        /// </summary>
        /// <param name="id">Game ID</param>
        /// <param name="game">Updated game data</param>
        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] VideoGame game)
        {
            if (game == null) return BadRequest();
            game.Id = id;
            return await _mediator.Send(new UpdateVideoGameCommand(game)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Delete a video game from the catalog.
        /// </summary>
        /// <param name="id">Game ID</param>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
            => await _mediator.Send(new DeleteVideoGameCommand(id)) ? NoContent() : NotFound();

        // ------------------------------------------------------------
        //  STEAM INTEGRATION
        // ------------------------------------------------------------

        /// <summary>
        /// Search Steam store for games by name.
        /// </summary>
        /// <param name="query">Search query</param>
        /// <returns>List of Steam search results</returns>
        [HttpGet("steam/search")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [ProducesResponseType(typeof(List<SteamSearchResult>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> SteamSearch([FromQuery] string query)
        {
            if (_steam == null) return StatusCode(503, new { Message = "Steam integration not available" });
            if (string.IsNullOrWhiteSpace(query)) return BadRequest();
            var results = await _steam.SearchAsync(query);
            return Ok(results);
        }

        /// <summary>
        /// Get game details from Steam by app ID.
        /// </summary>
        /// <param name="steamAppId">Steam app ID</param>
        /// <returns>Steam game details</returns>
        [HttpGet("steam/{steamAppId:int}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [ProducesResponseType(typeof(SteamGameDetails), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SteamDetails(int steamAppId)
        {
            if (_steam == null) return StatusCode(503, new { Message = "Steam integration not available" });
            var details = await _steam.GetDetailsAsync(steamAppId);
            return details != null ? Ok(details) : NotFound();
        }

        /// <summary>
        /// Import a game from Steam into the local catalog.
        /// </summary>
        /// <param name="steamAppId">Steam app ID</param>
        /// <returns>Created game ID</returns>
        [HttpPost("steam/import/{steamAppId:int}")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> ImportFromSteam(int steamAppId)
        {
            if (_steam == null) return StatusCode(503, new { Message = "Steam integration not available" });

            var details = await _steam.GetDetailsAsync(steamAppId);
            if (details == null) return NotFound(new { Message = $"Steam app {steamAppId} not found" });

            var platform = details.Platforms.Contains("Windows") ? GamePlatform.PC : GamePlatform.Other;

            var game = new AudioVerse.Domain.Entities.Games.VideoGame
            {
                Name = details.Name,
                Description = details.ShortDescription,
                Platform = platform,
                MinPlayers = 1,
                MaxPlayers = details.IsMultiplayer ? 4 : 1,
                Genre = details.Genres.Count > 0 ? string.Join(", ", details.Genres) : null,
                IsLocal = details.IsLocalMultiplayer,
                IsOnline = details.IsOnlineMultiplayer,
                SteamAppId = details.AppId,
                SteamHeaderImageUrl = details.HeaderImageUrl
            };

            var id = await _mediator.Send(new AddVideoGameCommand(game));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id, ImportedFrom = "Steam", SteamAppId = steamAppId });
        }

        // ------------------------------------------------------------
        //  VIDEO GAME SESSIONS
        // ------------------------------------------------------------

        /// <summary>Create a video game session for an event</summary>
        [HttpPost("sessions")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateSession([FromBody] AudioVerse.Domain.Entities.Games.VideoGameSession session)
        {
            session.StartedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameSessionCommand(session));
            return Created($"/api/games/video/sessions/{id}", new { Id = id });
        }

        /// <summary>Get sessions for an event</summary>
        [HttpGet("sessions/event/{eventId}")]
        public async Task<IActionResult> GetSessionsByEvent(int eventId)
        {
            var sessions = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetVideoGameSessionsByEventQuery(eventId));
            return Ok(sessions);
        }

        /// <summary>Get a session by ID</summary>
        [HttpGet("sessions/{id}")]
        public async Task<IActionResult> GetSession(int id)
        {
            var session = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetVideoGameSessionByIdQuery(id));
            return session != null ? Ok(session) : NotFound();
        }

        /// <summary>Delete a session</summary>
        [HttpDelete("sessions/{id}")]
        public async Task<IActionResult> DeleteSession(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteVideoGameSessionCommand(id));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a player to a session</summary>
        [HttpPost("sessions/{sessionId}/players")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddSessionPlayer(int sessionId, [FromBody] AudioVerse.Domain.Entities.Games.VideoGameSessionPlayer player)
        {
            player.SessionId = sessionId;
            player.JoinedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameSessionPlayerCommand(player));
            return Created($"/api/games/video/sessions/{sessionId}/players", new { Id = id });
        }

        /// <summary>Update a player's score</summary>
        [HttpPatch("session-players/{id}/score")]
        public async Task<IActionResult> UpdatePlayerScore(int id, [FromBody] int score)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.UpdateVideoGameSessionPlayerScoreCommand(id, score));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Remove a player from a session</summary>
        [HttpDelete("session-players/{id}")]
        public async Task<IActionResult> DeleteSessionPlayer(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteVideoGameSessionPlayerCommand(id));
            return ok ? NoContent() : NotFound();
        }

        // ════════════════════════════════════════════════════════════
        //  VIDEO GAME SESSION ROUNDS / PARTS / PART-PLAYERS
        // ════════════════════════════════════════════════════════════

        /// <summary>Add a round to a session</summary>
        [HttpPost("sessions/{sessionId}/rounds")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddRound(int sessionId, [FromBody] AudioVerse.Domain.Entities.Games.VideoGameSessionRound round)
        {
            round.SessionId = sessionId;
            round.CreatedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameSessionRoundCommand(round));
            return Created($"/api/games/video/sessions/{sessionId}/rounds", new { Id = id });
        }

        /// <summary>Get rounds for a session</summary>
        [HttpGet("sessions/{sessionId}/rounds")]
        public async Task<IActionResult> GetRounds(int sessionId)
        {
            var rounds = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetVideoGameSessionRoundsQuery(sessionId));
            return Ok(rounds);
        }

        /// <summary>Delete a round</summary>
        [HttpDelete("rounds/{roundId}")]
        public async Task<IActionResult> DeleteRound(int roundId)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteVideoGameSessionRoundCommand(roundId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a part to a round</summary>
        [HttpPost("rounds/{roundId}/parts")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddPart(int roundId, [FromBody] AudioVerse.Domain.Entities.Games.VideoGameSessionRoundPart part)
        {
            part.RoundId = roundId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameSessionRoundPartCommand(part));
            return Created($"/api/games/video/rounds/{roundId}/parts", new { Id = id });
        }

        /// <summary>Delete a part</summary>
        [HttpDelete("parts/{partId}")]
        public async Task<IActionResult> DeletePart(int partId)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteVideoGameSessionRoundPartCommand(partId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a player to a part</summary>
        [HttpPost("parts/{partId}/players")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddPartPlayer(int partId, [FromBody] AudioVerse.Domain.Entities.Games.VideoGameSessionRoundPartPlayer player)
        {
            player.PartId = partId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameSessionRoundPartPlayerCommand(player));
            return Created($"/api/games/video/parts/{partId}/players", new { Id = id });
        }

        /// <summary>Update a player's score in a part</summary>
        [HttpPatch("part-players/{id}/score")]
        public async Task<IActionResult> UpdatePartPlayerScore(int id, [FromBody] int score)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.UpdateVideoGameSessionRoundPartPlayerScoreCommand(id, score));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Remove a player from a part</summary>
        [HttpDelete("part-players/{id}")]
        public async Task<IActionResult> DeletePartPlayer(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteVideoGameSessionRoundPartPlayerCommand(id));
            return ok ? NoContent() : NotFound();
        }

        // ------------------------------------------------------------
        //  VIDEO GAME COLLECTIONS
        // ------------------------------------------------------------

        /// <summary>Create a collection</summary>
        [HttpPost("collections")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateCollection([FromBody] AudioVerse.Domain.Entities.Games.VideoGameCollection collection)
        {
            collection.CreatedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameCollectionCommand(collection));
            return Created($"/api/games/video/collections/{id}", new { Id = id });
        }

        /// <summary>Get a collection by ID (optionally with children hierarchy)</summary>
        [HttpGet("collections/{id}")]
        public async Task<IActionResult> GetCollection(int id, [FromQuery] bool includeChildren = false, [FromQuery] int maxDepth = 1)
        {
            var c = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetVideoGameCollectionByIdQuery(id, includeChildren, maxDepth));
            return c != null ? Ok(c) : NotFound();
        }

        /// <summary>Get collections by owner</summary>
        [HttpGet("collections/owner/{ownerId}")]
        public async Task<IActionResult> GetCollectionsByOwner(int ownerId)
        {
            var list = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetVideoGameCollectionsByOwnerQuery(ownerId));
            return Ok(list);
        }

        /// <summary>Update a collection</summary>
        [HttpPut("collections/{id}")]
        public async Task<IActionResult> UpdateCollection(int id, [FromBody] AudioVerse.Domain.Entities.Games.VideoGameCollection collection)
        {
            collection.Id = id;
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.UpdateVideoGameCollectionCommand(collection));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a collection</summary>
        [HttpDelete("collections/{id}")]
        public async Task<IActionResult> DeleteCollection(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteVideoGameCollectionCommand(id));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a video game to a collection</summary>
        [HttpPost("collections/{collectionId}/games")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddGameToCollection(int collectionId, [FromBody] AudioVerse.Domain.Entities.Games.VideoGameCollectionVideoGame item)
        {
            item.CollectionId = collectionId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddVideoGameToCollectionCommand(item));
            return Created($"/api/games/video/collections/{collectionId}/games", new { Id = id });
        }

        /// <summary>Remove a video game from a collection</summary>
        [HttpDelete("collections/games/{id}")]
        public async Task<IActionResult> RemoveGameFromCollection(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.RemoveVideoGameFromCollectionCommand(id));
            return ok ? NoContent() : NotFound();
        }

        // ════════════════════════════════════════════════════════════
        //  IGDB INTEGRATION
        // ════════════════════════════════════════════════════════════

        /// <summary>Search IGDB for video games</summary>
        [HttpGet("igdb/search")]
        public async Task<IActionResult> IgdbSearch([FromQuery] string query, [FromQuery] int limit = 10)
        {
            if (_igdb == null) return StatusCode(503, new { Message = "IGDB not configured" });
            if (string.IsNullOrWhiteSpace(query)) return BadRequest(new { Message = "Query required" });
            var results = await _igdb.SearchAsync(query, limit);
            return Ok(results);
        }

        /// <summary>Import a game from IGDB into local catalog</summary>
        [HttpPost("igdb/import/{igdbId:int}")]
        public async Task<IActionResult> ImportFromIgdb(int igdbId)
        {
            if (_igdb == null) return StatusCode(503, new { Message = "IGDB not configured" });
            var details = await _igdb.GetByIdAsync(igdbId);
            if (details == null) return NotFound(new { Message = $"IGDB game {igdbId} not found" });

            var game = new AudioVerse.Domain.Entities.Games.VideoGame
            {
                Name = details.Name,
                Description = details.Summary,
                Platform = AudioVerse.Domain.Enums.Events.GamePlatform.Other,
                MinPlayers = details.MinPlayers ?? 1,
                MaxPlayers = details.MaxPlayers ?? 1,
                ImportedFrom = "IGDB",
                IgdbId = igdbId,
                CoverImageUrl = details.CoverUrl
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddVideoGameCommand(game));
            return Created($"/api/games/video/{id}", new { Id = id, IgdbId = igdbId, Name = details.Name });
        }
    }
}


