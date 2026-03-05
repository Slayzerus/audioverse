using AudioVerse.Application.Services.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis.Bgg;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Services;

public class BggSyncServiceTests
{
    private static (BggSyncService Service, Mock<IGameRepository> Repo, Mock<IBggClient> Bgg) CreateService()
    {
        var repo = new Mock<IGameRepository>();
        var bgg = new Mock<IBggClient>();
        var logger = new Mock<ILogger<BggSyncService>>();

        var sp = new Mock<IServiceProvider>();
        sp.Setup(s => s.GetService(typeof(IGameRepository))).Returns(repo.Object);
        sp.Setup(s => s.GetService(typeof(IBggClient))).Returns(bgg.Object);

        var scope = new Mock<IServiceScope>();
        scope.Setup(s => s.ServiceProvider).Returns(sp.Object);

        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(f => f.CreateScope()).Returns(scope.Object);

        var service = new BggSyncService(factory.Object, logger.Object);
        return (service, repo, bgg);
    }

    [Fact]
    public async Task GetSyncStatus_ReturnsStatus()
    {
        var (svc, repo, _) = CreateService();
        var status = new BggSyncStatus { State = BggSyncState.Idle, TotalGames = 100, SyncedGames = 50 };
        repo.Setup(r => r.GetBggSyncStatusAsync()).ReturnsAsync(status);

        var result = await svc.GetSyncStatusAsync();

        Assert.Equal(BggSyncState.Idle, result.State);
        Assert.Equal(100, result.TotalGames);
        Assert.Equal(0.5, result.Progress);
    }

    [Fact]
    public async Task SearchCacheThrough_ReturnsLocal_WhenEnough()
    {
        var (svc, repo, bgg) = CreateService();
        var local = Enumerable.Range(1, 20)
            .Select(i => new BoardGame { Id = i, Name = $"Game {i}" })
            .ToList();

        repo.Setup(r => r.SearchBoardGamesAsync("catan", 20))
            .ReturnsAsync(local);

        var result = await svc.SearchWithCacheThroughAsync("catan", 20);

        Assert.Equal(20, result.Count);
        bgg.Verify(b => b.SearchAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SearchCacheThrough_FetchesFromBgg_WhenLocalInsufficient()
    {
        var (svc, repo, bgg) = CreateService();
        var local = new List<BoardGame>
        {
            new() { Id = 1, Name = "Catan", BggId = 13 }
        };

        repo.Setup(r => r.SearchBoardGamesAsync("catan", 20))
            .ReturnsAsync(local);

        bgg.Setup(b => b.SearchAsync("catan", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BggSearchResult>
            {
                new() { BggId = 13, Name = "Catan" }, // already local
                new() { BggId = 999, Name = "Catan Universe" }
            });

        bgg.Setup(b => b.GetDetailsBatchAsync(
                It.Is<IEnumerable<int>>(ids => ids.Contains(999)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BggGameDetails>
            {
                new()
                {
                    BggId = 999, Name = "Catan Universe",
                    MinPlayers = 2, MaxPlayers = 4,
                    Categories = new List<string>(), Mechanics = new List<string>(),
                    Designers = new List<string>(), Artists = new List<string>(),
                    Publishers = new List<string>()
                }
            });

        repo.Setup(r => r.UpsertBoardGamesFromBggAsync(It.IsAny<IEnumerable<BoardGame>>()))
            .ReturnsAsync(1);

        // After upsert, re-search returns more
        repo.SetupSequence(r => r.SearchBoardGamesAsync("catan", 20))
            .ReturnsAsync(local)
            .ReturnsAsync(new List<BoardGame>
            {
                new() { Id = 1, Name = "Catan" },
                new() { Id = 2, Name = "Catan Universe" }
            });

        var result = await svc.SearchWithCacheThroughAsync("catan", 20);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task SearchCacheThrough_ReturnsLocalOnly_WhenBggFails()
    {
        var (svc, repo, bgg) = CreateService();
        var local = new List<BoardGame> { new() { Id = 1, Name = "Local Only" } };

        repo.Setup(r => r.SearchBoardGamesAsync("query", 20))
            .ReturnsAsync(local);

        bgg.Setup(b => b.SearchAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("BGG down"));

        var result = await svc.SearchWithCacheThroughAsync("query", 20);

        Assert.Single(result);
        Assert.Equal("Local Only", result[0].Name);
    }

    [Fact]
    public async Task ExportCatalog_ReturnsAllBggGames()
    {
        var (svc, repo, _) = CreateService();
        repo.Setup(r => r.GetAllBggBoardGamesAsync())
            .ReturnsAsync(new List<BoardGame>
            {
                new() { Id = 1, BggId = 10 },
                new() { Id = 2, BggId = 20 }
            });

        var result = await svc.ExportCatalogAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ImportCatalog_CallsUpsert()
    {
        var (svc, repo, _) = CreateService();
        repo.Setup(r => r.UpsertBoardGamesFromBggAsync(It.IsAny<IEnumerable<BoardGame>>()))
            .ReturnsAsync(3);

        var games = new List<BoardGame>
        {
            new() { BggId = 1, Name = "Game A" },
            new() { BggId = 2, Name = "Game B" },
            new() { BggId = 3, Name = "Game C" }
        };

        var result = await svc.ImportCatalogAsync(games);

        Assert.Equal(3, result);
    }
}
