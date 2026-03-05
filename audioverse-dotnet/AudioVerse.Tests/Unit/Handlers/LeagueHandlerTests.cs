using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers;

public class LeagueHandlerTests
{
    // ── CreateLeague ──

    [Fact]
    public async Task CreateLeague_ReturnsId()
    {
        var repo = new Mock<ILeagueRepository>();
        var league = new League { Name = "Season 1", OwnerId = 1 };
        repo.Setup(r => r.CreateLeagueAsync(It.IsAny<League>())).ReturnsAsync(5);

        var handler = new CreateLeagueHandler(repo.Object);
        var result = await handler.Handle(new CreateLeagueCommand(league), CancellationToken.None);

        Assert.Equal(5, result);
    }

    // ── DeleteLeague ──

    [Fact]
    public async Task DeleteLeague_ReturnsTrue_WhenExists()
    {
        var repo = new Mock<ILeagueRepository>();
        repo.Setup(r => r.DeleteLeagueAsync(5)).ReturnsAsync(true);

        var handler = new DeleteLeagueHandler(repo.Object);
        var result = await handler.Handle(new DeleteLeagueCommand(5), CancellationToken.None);

        Assert.True(result);
    }

    // ── GetLeagueById ──

    [Fact]
    public async Task GetLeagueById_ReturnsNull_WhenNotFound()
    {
        var repo = new Mock<ILeagueRepository>();
        repo.Setup(r => r.GetLeagueByIdAsync(999)).ReturnsAsync((League?)null);

        var handler = new GetLeagueByIdHandler(repo.Object);
        var result = await handler.Handle(new GetLeagueByIdQuery(999), CancellationToken.None);

        Assert.Null(result);
    }

    // ── GenerateLeagueSchedule ──

    [Fact]
    public async Task GenerateSchedule_ReturnsZero_WhenLeagueNotFound()
    {
        var repo = new Mock<ILeagueRepository>();
        var eventRepo = new Mock<IKaraokeRepository>();
        repo.Setup(r => r.GetLeagueByIdAsync(999)).ReturnsAsync((League?)null);

        var handler = new GenerateLeagueScheduleHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateLeagueScheduleCommand(999, DateTime.UtcNow, 7), CancellationToken.None);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GenerateSchedule_ReturnsZero_WhenLessThan2Participants()
    {
        var repo = new Mock<ILeagueRepository>();
        var eventRepo = new Mock<IKaraokeRepository>();
        repo.Setup(r => r.GetLeagueByIdAsync(1)).ReturnsAsync(new League
        {
            Id = 1,
            Name = "Solo League",
            Participants = new List<LeagueParticipant>
            {
                new() { Id = 1, Name = "Only One" }
            }
        });

        var handler = new GenerateLeagueScheduleHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateLeagueScheduleCommand(1, DateTime.UtcNow, 7), CancellationToken.None);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GenerateSchedule_Creates_CorrectNumberOfMatches_For4Participants()
    {
        var repo = new Mock<ILeagueRepository>();
        var eventRepo = new Mock<IKaraokeRepository>();
        var league = new League
        {
            Id = 1,
            Name = "4-Team League",
            OwnerId = 5,
            Participants = new List<LeagueParticipant>
            {
                new() { Id = 1, Name = "A" },
                new() { Id = 2, Name = "B" },
                new() { Id = 3, Name = "C" },
                new() { Id = 4, Name = "D" }
            }
        };
        repo.Setup(r => r.GetLeagueByIdAsync(1)).ReturnsAsync(league);
        eventRepo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(10);
        repo.Setup(r => r.AddLeagueEventAsync(It.IsAny<LeagueEvent>())).ReturnsAsync(1);
        repo.Setup(r => r.UpdateLeagueAsync(It.IsAny<League>())).ReturnsAsync(true);

        var handler = new GenerateLeagueScheduleHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateLeagueScheduleCommand(1, DateTime.UtcNow, 7), CancellationToken.None);

        // 4 participants → 3 rounds × 2 matches = 6 total matches
        Assert.Equal(6, result);
        repo.Verify(r => r.UpdateLeagueAsync(It.Is<League>(l =>
            l.Status == LeagueStatus.InProgress)), Times.Once);
    }

    // ── RemoveLeagueParticipant ──

    [Fact]
    public async Task RemoveParticipant_ReturnsTrue()
    {
        var repo = new Mock<ILeagueRepository>();
        repo.Setup(r => r.RemoveParticipantAsync(10)).ReturnsAsync(true);

        var handler = new RemoveLeagueParticipantHandler(repo.Object);
        var result = await handler.Handle(
            new RemoveLeagueParticipantCommand(10), CancellationToken.None);

        Assert.True(result);
    }
}
