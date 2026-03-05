using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get fantasy league standings (teams ranked by total points).</summary>
public record GetFantasyStandingsQuery(int LeagueId) : IRequest<IEnumerable<FantasyTeam>>;
