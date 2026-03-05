using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get league standings (participants sorted by points).</summary>
public record GetLeagueStandingsQuery(int LeagueId) : IRequest<IEnumerable<LeagueParticipant>>;
