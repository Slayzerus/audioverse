using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving a user's betting history.</summary>
public class GetUserBetsHandler(IBettingRepository repo) : IRequestHandler<GetUserBetsQuery, IEnumerable<Bet>>
{
    public Task<IEnumerable<Bet>> Handle(GetUserBetsQuery req, CancellationToken ct) =>
        repo.GetBetsByUserAsync(req.UserId, req.LeagueId);
}
