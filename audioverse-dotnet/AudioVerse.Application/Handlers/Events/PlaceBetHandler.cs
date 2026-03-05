using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles placing a bet — validates wallet balance, deducts amount, creates bet.</summary>
public class PlaceBetHandler(IBettingRepository repo) : IRequestHandler<PlaceBetCommand, int>
{
    public async Task<int> Handle(PlaceBetCommand req, CancellationToken ct)
    {
        var market = await repo.GetMarketByIdAsync(req.MarketId);
        if (market == null || !market.IsOpen)
            return 0;

        var option = market.Options.FirstOrDefault(o => o.Id == req.OptionId);
        if (option == null)
            return 0;

        var wallet = await repo.GetOrCreateWalletAsync(req.UserId, req.LeagueId ?? market.LeagueId);
        if (wallet.Balance < req.Amount)
            return -1; // insufficient funds

        wallet.Balance -= req.Amount;
        wallet.TotalWagered += req.Amount;
        await repo.UpdateWalletAsync(wallet);

        var bet = new Bet
        {
            MarketId = req.MarketId,
            OptionId = req.OptionId,
            UserId = req.UserId,
            Amount = req.Amount,
            PotentialPayout = req.Amount * option.Odds
        };

        return await repo.PlaceBetAsync(bet);
    }
}
