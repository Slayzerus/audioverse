using AudioVerse.Application.Commands.MiniGames;
using AudioVerse.Application.Models.Requests.MiniGames;
using AudioVerse.Application.Queries.MiniGames;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Games.Controllers;

/// <summary>
/// Mini-game sessions, rounds, scores, leaderboards and player stats.
/// </summary>
[Route("api/minigames")]
[ApiController]
public class MiniGameController(IMediator mediator) : ControllerBase
{
    // ══════════════════════ SESSIONS ══════════════════════

    /// <summary>Create a new mini-game session.</summary>
    [Authorize]
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateMiniGameSessionRequest req)
    {
        var id = await mediator.Send(new CreateMiniGameSessionCommand(req.EventId, req.HostPlayerId, req.Title));
        return Ok(new { id });
    }

    /// <summary>End a mini-game session.</summary>
    [Authorize]
    [HttpPost("sessions/{sessionId}/end")]
    public async Task<IActionResult> EndSession(int sessionId)
        => await mediator.Send(new EndMiniGameSessionCommand(sessionId)) ? Ok() : NotFound();

    /// <summary>Get a session with all rounds and results.</summary>
    [HttpGet("sessions/{sessionId}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var session = await mediator.Send(new GetMiniGameSessionQuery(sessionId));
        if (session == null) return NotFound();

        return Ok(new
        {
            session.Id,
            session.EventId,
            session.HostPlayerId,
            hostPlayerName = session.HostPlayer?.Name,
            session.Title,
            session.StartedAtUtc,
            session.EndedAtUtc,
            rounds = session.Rounds.Select(r => new
            {
                r.Id,
                r.RoundNumber,
                r.Game,
                r.Mode,
                r.DurationSeconds,
                r.StartedAtUtc,
                r.EndedAtUtc,
                players = r.Players.Select(p => new
                {
                    p.PlayerId,
                    playerName = p.Player?.Name,
                    p.Score,
                    p.Placement,
                    p.IsPersonalBest,
                    p.XpEarned,
                    p.CompletedAtUtc
                })
            })
        });
    }

    // ══════════════════════ ROUNDS ══════════════════════

    /// <summary>Submit a completed mini-game round with player results. XP is awarded automatically.</summary>
    [Authorize]
    [HttpPost("sessions/{sessionId}/rounds")]
    public async Task<IActionResult> SubmitRound(int sessionId, [FromBody] SubmitMiniGameRoundRequest req)
    {
        try
        {
            var result = await mediator.Send(new SubmitMiniGameRoundCommand(
                sessionId, req.Game, req.Mode, req.SettingsJson, req.DurationSeconds,
                req.Players.Select(p => new MiniGamePlayerResult(p.PlayerId, p.Score, p.Placement, p.ResultDetailsJson)).ToList()));

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ══════════════════════ LEADERBOARD ══════════════════════

    /// <summary>Get a player's result in a specific mini-game round.</summary>
    [HttpGet("rounds/{roundId}/players/{playerId}")]
    public async Task<IActionResult> GetRoundPlayer(int roundId, int playerId)
    {
        var player = await mediator.Send(new GetMiniGameRoundPlayerQuery(roundId, playerId));
        if (player is null) return NotFound();

        return Ok(new
        {
            player.Id,
            player.RoundId,
            player.PlayerId,
            playerName = player.Player?.Name,
            player.Score,
            player.Placement,
            player.IsPersonalBest,
            player.XpEarned,
            player.ResultDetailsJson,
            player.CompletedAtUtc
        });
    }

    /// <summary>Get leaderboard for a specific mini-game (and optionally mode).</summary>
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard(
        [FromQuery] string game,
        [FromQuery] string? mode = null,
        [FromQuery] int top = 20)
    {
        if (string.IsNullOrWhiteSpace(game)) return BadRequest("game is required");
        var result = await mediator.Send(new GetMiniGameLeaderboardQuery(game, mode, top));
        return Ok(result);
    }

    // ══════════════════════ PLAYER STATS ══════════════════════

    /// <summary>Get a player's personal best scores across all mini-games.</summary>
    [HttpGet("players/{playerId}/stats")]
    public async Task<IActionResult> GetPlayerStats(int playerId)
    {
        var result = await mediator.Send(new GetPlayerMiniGameStatsQuery(playerId));
        return Ok(result);
    }
}
