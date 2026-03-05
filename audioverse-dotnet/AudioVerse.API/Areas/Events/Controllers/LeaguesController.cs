using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Leagues — series of events (sports league, e-sports tournament, book club season).
/// Supports auto-schedule generation, participants, and standings.
/// </summary>
[ApiController]
[Route("api/leagues")]
[Microsoft.AspNetCore.Authorization.Authorize]
[Produces("application/json")]
[Tags("Events - Leagues")]
public class LeaguesController(IMediator mediator) : ControllerBase
{
    /// <summary>Get a paged list of leagues, optionally filtered by organization.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? organizationId = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await mediator.Send(new GetLeaguesQuery(organizationId, page, pageSize));
        return Ok(new { items, total, page, pageSize });
    }

    /// <summary>Get a league by ID with participants and events.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var league = await mediator.Send(new GetLeagueByIdQuery(id));
        return league != null ? Ok(league) : NotFound();
    }

    /// <summary>Create a new league.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] League league)
    {
        var id = await mediator.Send(new CreateLeagueCommand(league));
        return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
    }

    /// <summary>Update a league.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] League league)
    {
        league.Id = id;
        return await mediator.Send(new UpdateLeagueCommand(league)) ? Ok() : NotFound();
    }

    /// <summary>Delete a league.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await mediator.Send(new DeleteLeagueCommand(id)) ? Ok() : NotFound();

    // ── Participants ──

    /// <summary>Add a participant to a league.</summary>
    [HttpPost("{leagueId:int}/participants")]
    public async Task<IActionResult> AddParticipant(int leagueId, [FromBody] LeagueParticipant participant)
    {
        participant.LeagueId = leagueId;
        var id = await mediator.Send(new AddLeagueParticipantCommand(participant));
        return Ok(new { Id = id });
    }

    /// <summary>Get league standings (participants sorted by points).</summary>
    [HttpGet("{leagueId:int}/standings")]
    public async Task<IActionResult> GetStandings(int leagueId) =>
        Ok(await mediator.Send(new GetLeagueStandingsQuery(leagueId)));

    /// <summary>Remove a participant from a league.</summary>
    [HttpDelete("participants/{id:int}")]
    public async Task<IActionResult> RemoveParticipant(int id) =>
        await mediator.Send(new RemoveLeagueParticipantCommand(id)) ? Ok() : NotFound();

    // ── Schedule Generation ──

    /// <summary>Auto-generate a round-robin schedule of match events for the league.</summary>
    [HttpPost("{leagueId:int}/generate-schedule")]
    public async Task<IActionResult> GenerateSchedule(int leagueId, [FromQuery] DateTime firstMatchDate, [FromQuery] int daysBetweenRounds = 7)
    {
        var count = await mediator.Send(new GenerateLeagueScheduleCommand(leagueId, firstMatchDate, daysBetweenRounds));
        return count > 0 ? Ok(new { MatchesCreated = count }) : BadRequest(new { error = "League not found or too few participants." });
    }
}
