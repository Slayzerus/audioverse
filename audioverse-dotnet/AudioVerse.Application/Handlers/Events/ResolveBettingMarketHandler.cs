using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles resolving a betting market and paying out winners.</summary>
public class ResolveBettingMarketHandler(IBettingRepository repo) : IRequestHandler<ResolveBettingMarketCommand, int>
{
    public Task<int> Handle(ResolveBettingMarketCommand req, CancellationToken ct) =>
        repo.ResolveMarketAsync(req.MarketId, req.WinningOptionId);
}
