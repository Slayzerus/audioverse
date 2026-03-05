using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles league standings query (participants sorted by points).</summary>
public class GetLeagueStandingsHandler(ILeagueRepository repo) : IRequestHandler<GetLeagueStandingsQuery, IEnumerable<LeagueParticipant>>
{
    public Task<IEnumerable<LeagueParticipant>> Handle(GetLeagueStandingsQuery req, CancellationToken ct) =>
        repo.GetParticipantsByLeagueAsync(req.LeagueId);
}
