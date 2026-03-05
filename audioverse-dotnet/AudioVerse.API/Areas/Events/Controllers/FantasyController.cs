using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Fantasy leagues — create teams, draft players, track standings.
/// </summary>
[ApiController]
[Route("api/leagues/{leagueId:int}/fantasy")]
[Microsoft.AspNetCore.Authorization.Authorize]
[Produces("application/json")]
[Tags("Events - Fantasy")]
public class FantasyController(IMediator mediator) : ControllerBase
{
    /// <summary>Get fantasy league standings (teams ranked by points).</summary>
    [HttpGet("standings")]
    public async Task<IActionResult> GetStandings(int leagueId) =>
        Ok(await mediator.Send(new GetFantasyStandingsQuery(leagueId)));

    /// <summary>Create a fantasy team in a league.</summary>
    [HttpPost("teams")]
    public async Task<IActionResult> CreateTeam(int leagueId, [FromBody] FantasyTeam team)
    {
        team.LeagueId = leagueId;
        var id = await mediator.Send(new CreateFantasyTeamCommand(team));
        return CreatedAtAction(nameof(GetTeam), new { leagueId, id }, new { Id = id });
    }

    /// <summary>Get a fantasy team by ID.</summary>
    [HttpGet("teams/{id:int}")]
    public async Task<IActionResult> GetTeam(int leagueId, int id)
    {
        var team = await mediator.Send(new GetFantasyTeamQuery(id));
        return team != null ? Ok(team) : NotFound();
    }

    /// <summary>Draft a player to a fantasy team.</summary>
    [HttpPost("teams/{teamId:int}/players")]
    public async Task<IActionResult> DraftPlayer(int leagueId, int teamId, [FromBody] FantasyTeamPlayer player)
    {
        player.FantasyTeamId = teamId;
        var id = await mediator.Send(new DraftFantasyPlayerCommand(player));
        return Ok(new { Id = id });
    }

    /// <summary>Drop (release) a player from a fantasy team.</summary>
    [HttpDelete("players/{playerId:int}")]
    public async Task<IActionResult> DropPlayer(int leagueId, int playerId) =>
        await mediator.Send(new DropFantasyPlayerCommand(playerId)) ? Ok() : NotFound();
}
