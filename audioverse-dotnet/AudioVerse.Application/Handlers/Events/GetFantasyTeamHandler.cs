using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving a fantasy team by ID.</summary>
public class GetFantasyTeamHandler(ILeagueRepository repo) : IRequestHandler<GetFantasyTeamQuery, FantasyTeam?>
{
    public Task<FantasyTeam?> Handle(GetFantasyTeamQuery req, CancellationToken ct) =>
        repo.GetFantasyTeamByIdAsync(req.Id);
}
