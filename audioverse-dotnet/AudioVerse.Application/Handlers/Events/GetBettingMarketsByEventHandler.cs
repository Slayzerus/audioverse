using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving betting markets for an event.</summary>
public class GetBettingMarketsByEventHandler(IBettingRepository repo) : IRequestHandler<GetBettingMarketsByEventQuery, IEnumerable<BettingMarket>>
{
    public Task<IEnumerable<BettingMarket>> Handle(GetBettingMarketsByEventQuery req, CancellationToken ct) =>
        repo.GetMarketsByEventAsync(req.EventId);
}
