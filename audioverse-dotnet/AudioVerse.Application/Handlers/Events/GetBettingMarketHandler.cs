using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving a betting market by ID.</summary>
public class GetBettingMarketHandler(IBettingRepository repo) : IRequestHandler<GetBettingMarketQuery, BettingMarket?>
{
    public Task<BettingMarket?> Handle(GetBettingMarketQuery req, CancellationToken ct) =>
        repo.GetMarketByIdAsync(req.Id);
}
