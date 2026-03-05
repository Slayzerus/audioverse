using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Infrastructure.ExternalApis.Bgg;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Entities.Games;

namespace AudioVerse.API.Areas.Games.Controllers
{
    /// <summary>
    /// Board games catalog with BoardGameGeek integration.
    /// </summary>
    [ApiController]
    [Route("api/games/board")]
    [Authorize]
    [Produces("application/json")]
    public class BoardGamesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IBggClient? _bgg;

        public BoardGamesController(IMediator mediator, IBggClient? bgg = null)
        {
            _mediator = mediator;
            _bgg = bgg;
        }

        // ════════════════════════════════════════════════════════════
        //  LOCAL CATALOG CRUD
        // ════════════════════════════════════════════════════════════

        /// <summary>Get board games with optional filtering, sorting, and pagination</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] AudioVerse.Application.Models.Requests.Games.GameCatalogFilterRequest filter)
        {
            if (filter.Page < 1 && string.IsNullOrEmpty(filter.Query) && !filter.MinPlayers.HasValue && !filter.MaxPlayers.HasValue)
                return Ok(await _mediator.Send(new GetAllBoardGamesQuery()));
            return Ok(await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGamesPagedQuery(filter)));
        }

        /// <summary>Get a board game by ID from local catalog</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var game = await _mediator.Send(new GetBoardGameByIdQuery(id));
            return game != null ? Ok(game) : NotFound();
        }

        /// <summary>Create a new board game in local catalog</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BoardGame game)
        {
            if (game == null) return BadRequest();
            var id = await _mediator.Send(new AddBoardGameCommand(game));
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>Update a board game in local catalog</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] BoardGame game)
        {
            if (game == null) return BadRequest();
            game.Id = id;
            return await _mediator.Send(new UpdateBoardGameCommand(game)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a board game from local catalog</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
            => await _mediator.Send(new DeleteBoardGameCommand(id)) ? NoContent() : NotFound();

        // ════════════════════════════════════════════════════════════
        //  BGG INTEGRATION - SEARCH & DETAILS
        // ════════════════════════════════════════════════════════════

        /// <summary>Search BoardGameGeek for games by name</summary>
        /// <param name="query">Search query (game name)</param>
        [HttpGet("bgg/search")]
        [AllowAnonymous]
        public async Task<IActionResult> BggSearch([FromQuery] string query)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");
            if (string.IsNullOrWhiteSpace(query)) return BadRequest(new { Message = "Query is required" });

            var results = await _bgg.SearchAsync(query);
            return Ok(new { Count = results.Count, Results = results });
        }

        /// <summary>Get detailed info for a game from BoardGameGeek</summary>
        /// <param name="bggId">BoardGameGeek game ID</param>
        [HttpGet("bgg/{bggId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> BggDetails(int bggId)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");

            var details = await _bgg.GetDetailsAsync(bggId);
            return details != null ? Ok(details) : NotFound(new { Message = $"BGG game {bggId} not found" });
        }

        /// <summary>Get detailed info for multiple games from BoardGameGeek (batch)</summary>
        /// <param name="bggIds">Comma-separated BGG IDs (max 20)</param>
        [HttpGet("bgg/batch")]
        [AllowAnonymous]
        public async Task<IActionResult> BggDetailsBatch([FromQuery] string bggIds)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");
            if (string.IsNullOrWhiteSpace(bggIds)) return BadRequest(new { Message = "bggIds is required" });

            var ids = bggIds.Split(',')
                .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
                .Where(id => id > 0)
                .Take(20) // Limit to 20
                .ToList();

            if (ids.Count == 0) return BadRequest(new { Message = "No valid IDs provided" });

            var results = await _bgg.GetDetailsBatchAsync(ids);
            return Ok(new { Count = results.Count, Games = results });
        }

        // ════════════════════════════════════════════════════════════
        //  BGG INTEGRATION - TRENDING & HOT
        // ════════════════════════════════════════════════════════════

        /// <summary>Get current hot/trending games from BoardGameGeek</summary>
        [HttpGet("bgg/hot")]
        [AllowAnonymous]
        [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "CacheMedium")]
        public async Task<IActionResult> BggHotGames()
        {
            if (_bgg == null) return ServiceUnavailable("BGG");

            var hot = await _bgg.GetHotGamesAsync();
            return Ok(new { Count = hot.Count, Games = hot });
        }

        // ════════════════════════════════════════════════════════════
        //  BGG INTEGRATION - USER COLLECTION
        // ════════════════════════════════════════════════════════════

        /// <summary>Get a BGG user's board game collection</summary>
        /// <param name="username">BoardGameGeek username</param>
        /// <param name="owned">Filter to owned games only (default true)</param>
        [HttpGet("bgg/collection/{username}")]
        [AllowAnonymous]
        public async Task<IActionResult> BggUserCollection(string username, [FromQuery] bool owned = true)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");
            if (string.IsNullOrWhiteSpace(username)) return BadRequest(new { Message = "Username is required" });

            var collection = await _bgg.GetUserCollectionAsync(username, owned);
            return Ok(new { Username = username, Count = collection.Count, Games = collection });
        }

        // ════════════════════════════════════════════════════════════
        //  BGG INTEGRATION - IMPORT
        // ════════════════════════════════════════════════════════════

        /// <summary>Import a single game from BGG into local catalog</summary>
        /// <param name="bggId">BoardGameGeek game ID</param>
        [HttpPost("bgg/import/{bggId:int}")]
        public async Task<IActionResult> ImportFromBgg(int bggId)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");

            var details = await _bgg.GetDetailsAsync(bggId);
            if (details == null) return NotFound(new { Message = $"BGG game {bggId} not found" });

            var game = MapBggToEntity(details);
            var id = await _mediator.Send(new AddBoardGameCommand(game));

            return CreatedAtAction(nameof(GetById), new { id }, new
            {
                Id = id,
                ImportedFrom = "BGG",
                BggId = bggId,
                Name = details.Name
            });
        }

        /// <summary>Import multiple games from BGG into local catalog</summary>
        /// <param name="request">List of BGG IDs to import</param>
        [HttpPost("bgg/import/batch")]
        public async Task<IActionResult> ImportBatchFromBgg([FromBody] BggBatchImportRequest request)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");
            if (request?.BggIds == null || request.BggIds.Count == 0)
                return BadRequest(new { Message = "BggIds list is required" });

            var ids = request.BggIds.Distinct().Take(20).ToList();
            var details = await _bgg.GetDetailsBatchAsync(ids);

            var imported = new List<object>();
            foreach (var d in details)
            {
                var game = MapBggToEntity(d);
                var id = await _mediator.Send(new AddBoardGameCommand(game));
                imported.Add(new { Id = id, BggId = d.BggId, Name = d.Name });
            }

            return Ok(new { ImportedCount = imported.Count, Games = imported });
        }

        /// <summary>Import all owned games from a BGG user's collection</summary>
        /// <param name="username">BoardGameGeek username</param>
        [HttpPost("bgg/import/collection/{username}")]
        public async Task<IActionResult> ImportUserCollection(string username)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");
            if (string.IsNullOrWhiteSpace(username)) return BadRequest(new { Message = "Username is required" });

            var collection = await _bgg.GetUserCollectionAsync(username, owned: true);
            if (collection.Count == 0) return Ok(new { Message = "No owned games found", ImportedCount = 0 });

            // Get full details for all games
            var bggIds = collection.Select(c => c.BggId).ToList();
            var allDetails = new List<BggGameDetails>();

            // Batch in groups of 20
            foreach (var batch in bggIds.Chunk(20))
            {
                var details = await _bgg.GetDetailsBatchAsync(batch);
                allDetails.AddRange(details);
                await Task.Delay(1000); // Rate limiting
            }

            var imported = new List<object>();
            foreach (var d in allDetails)
            {
                var game = MapBggToEntity(d);
                var id = await _mediator.Send(new AddBoardGameCommand(game));
                imported.Add(new { Id = id, BggId = d.BggId, Name = d.Name });
            }

            return Ok(new
            {
                Username = username,
                ImportedCount = imported.Count,
                Games = imported
            });
        }

        // ════════════════════════════════════════════════════════════
        //  BGG INTEGRATION - REFRESH/SYNC
        // ════════════════════════════════════════════════════════════

        /// <summary>Refresh a local game's data from BGG</summary>
        /// <param name="id">Local game ID</param>
        [HttpPost("{id:int}/refresh-bgg")]
        public async Task<IActionResult> RefreshFromBgg(int id)
        {
            if (_bgg == null) return ServiceUnavailable("BGG");

            var existing = await _mediator.Send(new GetBoardGameByIdQuery(id));
            if (existing == null) return NotFound();
            if (existing.BggId == null) return BadRequest(new { Message = "Game has no BGG ID associated" });

            var details = await _bgg.GetDetailsAsync(existing.BggId.Value);
            if (details == null) return NotFound(new { Message = $"BGG game {existing.BggId} not found" });

            // Update fields from BGG
            existing.Name = details.Name;
            existing.Description = details.Description;
            existing.MinPlayers = details.MinPlayers;
            existing.MaxPlayers = details.MaxPlayers;
            existing.EstimatedDurationMinutes = details.PlayingTimeMinutes;
            existing.Genre = details.Categories.Count > 0 ? string.Join(", ", details.Categories) : null;
            existing.BggImageUrl = details.ImageUrl;
            existing.BggRating = details.AverageRating;
            existing.BggYearPublished = details.YearPublished;

            await _mediator.Send(new UpdateBoardGameCommand(existing));

            return Ok(new { Success = true, RefreshedFrom = "BGG", BggId = existing.BggId });
        }

        // ════════════════════════════════════════════════════════════
        //  HELPERS
        // ════════════════════════════════════════════════════════════

        private static BoardGame MapBggToEntity(BggGameDetails details) => new()
        {
            Name = details.Name,
            Description = details.Description,
            MinPlayers = details.MinPlayers,
            MaxPlayers = details.MaxPlayers,
            EstimatedDurationMinutes = details.PlayingTimeMinutes,
            Genre = details.Categories.Count > 0 ? string.Join(", ", details.Categories) : null,
            BggId = details.BggId,
            BggImageUrl = details.ImageUrl,
            BggRating = details.AverageRating,
            BggYearPublished = details.YearPublished
        };

        private static ObjectResult ServiceUnavailable(string service) =>
            new(new { Message = $"{service} integration not available" }) { StatusCode = 503 };

        // ════════════════════════════════════════════════════════════
        //  BOARD GAME SESSIONS
        // ════════════════════════════════════════════════════════════

        /// <summary>Create a board game session for an event</summary>
        [HttpPost("sessions")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateSession([FromBody] BoardGameSession session)
        {
            session.StartedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddBoardGameSessionCommand(session));
            return Created($"/api/games/board/sessions/{id}", new { Id = id });
        }

        /// <summary>Get sessions for an event</summary>
        [HttpGet("sessions/event/{eventId}")]
        public async Task<IActionResult> GetSessionsByEvent(int eventId)
        {
            var sessions = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGameSessionsByEventQuery(eventId));
            return Ok(sessions);
        }

        /// <summary>Get a session by ID with rounds</summary>
        [HttpGet("sessions/{id}")]
        public async Task<IActionResult> GetSession(int id)
        {
            var session = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGameSessionByIdQuery(id));
            return session != null ? Ok(session) : NotFound();
        }

        /// <summary>Delete a session</summary>
        [HttpDelete("sessions/{id}")]
        public async Task<IActionResult> DeleteSession(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteBoardGameSessionCommand(id));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a round to a session</summary>
        [HttpPost("sessions/{sessionId}/rounds")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddRound(int sessionId, [FromBody] BoardGameSessionRound round)
        {
            round.SessionId = sessionId;
            round.CreatedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddBoardGameSessionRoundCommand(round));
            return Created($"/api/games/board/sessions/{sessionId}/rounds", new { Id = id });
        }

        /// <summary>Get rounds for a session</summary>
        [HttpGet("sessions/{sessionId}/rounds")]
        public async Task<IActionResult> GetRounds(int sessionId)
        {
            var rounds = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGameSessionRoundsQuery(sessionId));
            return Ok(rounds);
        }

        /// <summary>Delete a round</summary>
        [HttpDelete("rounds/{roundId}")]
        public async Task<IActionResult> DeleteRound(int roundId)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteBoardGameSessionRoundCommand(roundId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a part to a round</summary>
        [HttpPost("rounds/{roundId}/parts")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddPart(int roundId, [FromBody] BoardGameSessionRoundPart part)
        {
            part.RoundId = roundId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddBoardGameSessionRoundPartCommand(part));
            return Created($"/api/games/board/rounds/{roundId}/parts", new { Id = id });
        }

        /// <summary>Delete a part</summary>
        [HttpDelete("parts/{partId}")]
        public async Task<IActionResult> DeletePart(int partId)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteBoardGameSessionRoundPartCommand(partId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a player to a part</summary>
        [HttpPost("parts/{partId}/players")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddPartPlayer(int partId, [FromBody] BoardGameSessionRoundPartPlayer player)
        {
            player.PartId = partId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddBoardGameSessionRoundPartPlayerCommand(player));
            return Created($"/api/games/board/parts/{partId}/players", new { Id = id });
        }

        /// <summary>Update a player's score</summary>
        [HttpPatch("part-players/{id}/score")]
        public async Task<IActionResult> UpdatePartPlayerScore(int id, [FromBody] int score)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.UpdateBoardGameSessionRoundPartPlayerScoreCommand(id, score));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Remove a player from a part</summary>
        [HttpDelete("part-players/{id}")]
        public async Task<IActionResult> DeletePartPlayer(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteBoardGameSessionRoundPartPlayerCommand(id));
            return ok ? NoContent() : NotFound();
        }

        // ════════════════════════════════════════════════════════════
        //  BOARD GAME COLLECTIONS
        // ════════════════════════════════════════════════════════════

        /// <summary>Create a collection</summary>
        [HttpPost("collections")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateCollection([FromBody] BoardGameCollection collection)
        {
            collection.CreatedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddBoardGameCollectionCommand(collection));
            return Created($"/api/games/board/collections/{id}", new { Id = id });
        }

        /// <summary>Get a collection by ID (optionally with children hierarchy)</summary>
        [HttpGet("collections/{id}")]
        public async Task<IActionResult> GetCollection(int id, [FromQuery] bool includeChildren = false, [FromQuery] int maxDepth = 1)
        {
            var c = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGameCollectionByIdQuery(id, includeChildren, maxDepth));
            return c != null ? Ok(c) : NotFound();
        }

        /// <summary>Get collections by owner</summary>
        [HttpGet("collections/owner/{ownerId}")]
        public async Task<IActionResult> GetCollectionsByOwner(int ownerId)
        {
            var list = await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGameCollectionsByOwnerQuery(ownerId));
            return Ok(list);
        }

        /// <summary>Update a collection</summary>
        [HttpPut("collections/{id}")]
        public async Task<IActionResult> UpdateCollection(int id, [FromBody] BoardGameCollection collection)
        {
            collection.Id = id;
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.UpdateBoardGameCollectionCommand(collection));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a collection</summary>
        [HttpDelete("collections/{id}")]
        public async Task<IActionResult> DeleteCollection(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.DeleteBoardGameCollectionCommand(id));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a board game to a collection</summary>
        [HttpPost("collections/{collectionId}/games")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddGameToCollection(int collectionId, [FromBody] BoardGameCollectionBoardGame item)
        {
            item.CollectionId = collectionId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Games.AddBoardGameToCollectionCommand(item));
            return Created($"/api/games/board/collections/{collectionId}/games", new { Id = id });
        }

        /// <summary>Remove a board game from a collection</summary>
        [HttpDelete("collections/games/{id}")]
        public async Task<IActionResult> RemoveGameFromCollection(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Games.RemoveBoardGameFromCollectionCommand(id));
            return ok ? NoContent() : NotFound();
        }

        // ════════════════════════════════════════════════════════════
        //  STATISTICS
        // ════════════════════════════════════════════════════════════

        /// <summary>Get player board game statistics (wins, avg score, top games)</summary>
        [HttpGet("stats/player/{playerId:int}")]
        public async Task<IActionResult> GetPlayerStats(int playerId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Games.GetPlayerBoardGameStatsQuery(playerId)));

        /// <summary>Get board game statistics (play count, avg duration, highest score)</summary>
        [HttpGet("stats/game/{gameId:int}")]
        public async Task<IActionResult> GetGameStats(int gameId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Games.GetBoardGameStatsQuery(gameId)));
    }
}

