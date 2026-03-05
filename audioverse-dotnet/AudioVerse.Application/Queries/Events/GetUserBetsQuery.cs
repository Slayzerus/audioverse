using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get a user's betting history.</summary>
public record GetUserBetsQuery(int UserId, int? LeagueId = null) : IRequest<IEnumerable<Bet>>;
