using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers;

public class BettingHandlerTests
{
    // ── PlaceBet ──

    [Fact]
    public async Task PlaceBet_ReturnsZero_WhenMarketNotFound()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetMarketByIdAsync(999)).ReturnsAsync((BettingMarket?)null);

        var handler = new PlaceBetHandler(repo.Object);
        var result = await handler.Handle(
            new PlaceBetCommand(999, 1, 1, 100m), CancellationToken.None);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task PlaceBet_ReturnsZero_WhenMarketClosed()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetMarketByIdAsync(1))
            .ReturnsAsync(new BettingMarket { Id = 1, IsOpen = false });

        var handler = new PlaceBetHandler(repo.Object);
        var result = await handler.Handle(
            new PlaceBetCommand(1, 1, 1, 100m), CancellationToken.None);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task PlaceBet_ReturnsZero_WhenOptionNotFound()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetMarketByIdAsync(1))
            .ReturnsAsync(new BettingMarket
            {
                Id = 1,
                IsOpen = true,
                Options = new List<BettingOption>
                {
                    new() { Id = 10, Label = "Team A", Odds = 2.0m }
                }
            });

        var handler = new PlaceBetHandler(repo.Object);
        var result = await handler.Handle(
            new PlaceBetCommand(1, 999, 1, 100m), CancellationToken.None); // option 999 doesn't exist

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task PlaceBet_ReturnsNegative_WhenInsufficientFunds()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetMarketByIdAsync(1))
            .ReturnsAsync(new BettingMarket
            {
                Id = 1,
                IsOpen = true,
                LeagueId = 5,
                Options = new List<BettingOption>
                {
                    new() { Id = 10, Label = "Team A", Odds = 2.0m }
                }
            });
        repo.Setup(r => r.GetOrCreateWalletAsync(1, 5, 1000m))
            .ReturnsAsync(new VirtualWallet { Id = 1, UserId = 1, Balance = 50m }); // only 50

        var handler = new PlaceBetHandler(repo.Object);
        var result = await handler.Handle(
            new PlaceBetCommand(1, 10, 1, 100m), CancellationToken.None); // wants to bet 100

        Assert.Equal(-1, result); // insufficient funds
    }

    [Fact]
    public async Task PlaceBet_DeductsBalanceAndReturnsId()
    {
        var repo = new Mock<IBettingRepository>();
        var wallet = new VirtualWallet { Id = 1, UserId = 1, Balance = 500m, TotalWagered = 0m };
        repo.Setup(r => r.GetMarketByIdAsync(1))
            .ReturnsAsync(new BettingMarket
            {
                Id = 1,
                IsOpen = true,
                LeagueId = 5,
                Options = new List<BettingOption>
                {
                    new() { Id = 10, Label = "Team A", Odds = 2.5m }
                }
            });
        repo.Setup(r => r.GetOrCreateWalletAsync(1, 5, 1000m))
            .ReturnsAsync(wallet);
        repo.Setup(r => r.UpdateWalletAsync(It.IsAny<VirtualWallet>()))
            .ReturnsAsync(true);
        repo.Setup(r => r.PlaceBetAsync(It.IsAny<Bet>()))
            .ReturnsAsync(42);

        var handler = new PlaceBetHandler(repo.Object);
        var result = await handler.Handle(
            new PlaceBetCommand(1, 10, 1, 200m), CancellationToken.None);

        Assert.Equal(42, result);
        repo.Verify(r => r.UpdateWalletAsync(It.Is<VirtualWallet>(w =>
            w.Balance == 300m && w.TotalWagered == 200m)), Times.Once);
        repo.Verify(r => r.PlaceBetAsync(It.Is<Bet>(b =>
            b.Amount == 200m && b.PotentialPayout == 500m && b.OptionId == 10)), Times.Once);
    }

    // ── CreateBettingMarket ──

    [Fact]
    public async Task CreateMarket_ReturnsId()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.CreateMarketAsync(It.IsAny<BettingMarket>()))
            .ReturnsAsync(7);

        var handler = new CreateBettingMarketHandler(repo.Object);
        var result = await handler.Handle(
            new CreateBettingMarketCommand(new BettingMarket
            {
                EventId = 1, Title = "Winner", Type = BettingMarketType.Winner
            }),
            CancellationToken.None);

        Assert.Equal(7, result);
    }

    // ── GetBettingMarket ──

    [Fact]
    public async Task GetMarket_ReturnsNull_WhenNotFound()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetMarketByIdAsync(999)).ReturnsAsync((BettingMarket?)null);

        var handler = new GetBettingMarketHandler(repo.Object);
        var result = await handler.Handle(
            new GetBettingMarketQuery(999), CancellationToken.None);

        Assert.Null(result);
    }

    // ── GetUserBets ──

    [Fact]
    public async Task GetUserBets_ReturnsList()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetBetsByUserAsync(1, null))
            .ReturnsAsync(new List<Bet>
            {
                new() { Id = 1, Amount = 100m },
                new() { Id = 2, Amount = 200m }
            });

        var handler = new GetUserBetsHandler(repo.Object);
        var result = await handler.Handle(
            new GetUserBetsQuery(1, null), CancellationToken.None);

        Assert.Equal(2, result.Count());
    }

    // ── GetWallet ──

    [Fact]
    public async Task GetWallet_CreatesDefault_WhenNotExists()
    {
        var repo = new Mock<IBettingRepository>();
        repo.Setup(r => r.GetOrCreateWalletAsync(1, null, 1000m))
            .ReturnsAsync(new VirtualWallet { Id = 1, Balance = 1000m });

        var handler = new GetWalletHandler(repo.Object);
        var result = await handler.Handle(
            new GetWalletQuery(1, null), CancellationToken.None);

        Assert.Equal(1000m, result.Balance);
    }
}
