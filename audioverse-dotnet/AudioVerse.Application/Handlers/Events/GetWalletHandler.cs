using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving a user's virtual wallet.</summary>
public class GetWalletHandler(IBettingRepository repo) : IRequestHandler<GetWalletQuery, VirtualWallet>
{
    public Task<VirtualWallet> Handle(GetWalletQuery req, CancellationToken ct) =>
        repo.GetOrCreateWalletAsync(req.UserId, req.LeagueId);
}
