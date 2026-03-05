using AudioVerse.Application.Services.Games;
using AudioVerse.API.Models.Requests.Games;
using AudioVerse.Domain.Entities.Games;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Games.Controllers;

/// <summary>
/// BGG catalog integration — sync, cache-through search, export/import.
/// </summary>
[ApiController]
[Route("api/bgg")]
[Produces("application/json")]
[Tags("Games - BGG Catalog")]
public class BggCatalogController(IBggSyncService bggSync) : ControllerBase
{
    /// <summary>Search board games — local DB first, then BGG if needed (cache-through).</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required");
        limit = Math.Clamp(limit, 1, 100);
        var results = await bggSync.SearchWithCacheThroughAsync(q, limit);
        return Ok(results.Select(g => new
        {
            g.Id, g.Name, g.Description, g.MinPlayers, g.MaxPlayers,
            g.EstimatedDurationMinutes, g.BggId, g.BggImageUrl, g.BggThumbnailUrl,
            g.BggRating, g.BggYearPublished, g.BggWeight, g.BggRank,
            g.BggCategories, g.BggMechanics
        }));
    }

    /// <summary>Get current BGG sync status (progress, state, errors).</summary>
    [HttpGet("sync/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSyncStatus()
    {
        var status = await bggSync.GetSyncStatusAsync();
        return Ok(new
        {
            status.State, status.TotalGames, status.SyncedGames, status.FailedGames,
            status.Progress, status.LastSyncedBggId,
            status.StartedAtUtc, status.FinishedAtUtc, status.LastFullSyncUtc,
            status.ErrorMessage
        });
    }

    /// <summary>Start a full BGG catalog sync (hot games + stale refresh, 5s rate limit).</summary>
    [HttpPost("sync/start")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> StartSync()
    {
        await bggSync.StartFullSyncAsync();
        return Ok(new { message = "BGG sync started" });
    }

    /// <summary>Cancel a running BGG sync.</summary>
    [HttpPost("sync/cancel")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CancelSync()
    {
        await bggSync.CancelSyncAsync();
        return Ok(new { message = "BGG sync cancellation requested" });
    }

    /// <summary>Export the local BGG game catalog as JSON (for backup/transfer).</summary>
    [HttpGet("export")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportCatalog()
    {
        var games = await bggSync.ExportCatalogAsync();
        return Ok(games.Select(g => new
        {
            g.BggId, g.Name, g.Description, g.MinPlayers, g.MaxPlayers,
            g.EstimatedDurationMinutes, g.BggImageUrl, g.BggThumbnailUrl,
            g.BggRating, g.BggYearPublished, g.BggWeight, g.BggRank,
            g.BggUsersRated, g.BggMinAge,
            g.BggCategories, g.BggMechanics, g.BggDesigners, g.BggPublishers,
            g.BggLastSyncUtc
        }));
    }

    /// <summary>Import BGG games from JSON (upsert by BggId — no re-sync needed after restart).</summary>
    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    [Consumes("application/json")]
    public async Task<IActionResult> ImportCatalog([FromBody] List<BggImportItem> items)
    {
        if (items == null || items.Count == 0) return BadRequest("No games to import");

        var games = items.Select(i => new BoardGame
        {
            BggId = i.BggId,
            Name = i.Name,
            Description = i.Description,
            MinPlayers = i.MinPlayers,
            MaxPlayers = i.MaxPlayers,
            EstimatedDurationMinutes = i.EstimatedDurationMinutes,
            BggImageUrl = i.BggImageUrl,
            BggThumbnailUrl = i.BggThumbnailUrl,
            BggRating = i.BggRating,
            BggYearPublished = i.BggYearPublished,
            BggWeight = i.BggWeight,
            BggRank = i.BggRank,
            BggUsersRated = i.BggUsersRated,
            BggMinAge = i.BggMinAge,
            BggCategories = i.BggCategories,
            BggMechanics = i.BggMechanics,
            BggDesigners = i.BggDesigners,
            BggPublishers = i.BggPublishers,
            BggLastSyncUtc = i.BggLastSyncUtc ?? DateTime.UtcNow
        }).ToList();

        var count = await bggSync.ImportCatalogAsync(games);
        return Ok(new { imported = count });
    }
}
