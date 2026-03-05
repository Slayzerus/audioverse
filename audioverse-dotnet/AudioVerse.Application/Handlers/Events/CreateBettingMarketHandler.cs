using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles creating a betting market.</summary>
public class CreateBettingMarketHandler(IBettingRepository repo) : IRequestHandler<CreateBettingMarketCommand, int>
{
    public Task<int> Handle(CreateBettingMarketCommand req, CancellationToken ct) =>
        repo.CreateMarketAsync(req.Market);
}
