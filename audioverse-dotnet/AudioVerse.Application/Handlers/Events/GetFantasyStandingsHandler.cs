using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles fantasy league standings.</summary>
public class GetFantasyStandingsHandler(ILeagueRepository repo) : IRequestHandler<GetFantasyStandingsQuery, IEnumerable<FantasyTeam>>
{
    public Task<IEnumerable<FantasyTeam>> Handle(GetFantasyStandingsQuery req, CancellationToken ct) =>
        repo.GetFantasyTeamsByLeagueAsync(req.LeagueId);
}
