using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers;

public class RecurringEventHandlerTests
{
    // ── GenerateNextOccurrence ──

    [Fact]
    public async Task GenerateNext_ReturnsZero_WhenEventNotFound()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        repo.Setup(r => r.GetEventByIdAsync(999)).ReturnsAsync((Event?)null);

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateNextOccurrenceCommand(999), CancellationToken.None);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GenerateNext_ReturnsZero_WhenNotRecurring()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        var ev = new Event { Id = 1, Title = "OneOff", Recurrence = RecurrencePattern.None };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateNextOccurrenceCommand(1), CancellationToken.None);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GenerateNext_Weekly_CalculatesCorrectStartTime()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        var start = new DateTime(2025, 6, 23, 18, 0, 0, DateTimeKind.Utc);
        var ev = new Event
        {
            Id = 1,
            Title = "Game Night",
            Recurrence = RecurrencePattern.Weekly,
            RecurrenceInterval = 1,
            StartTime = start,
            EndTime = start.AddHours(4),
            OrganizerId = 5,
            Type = EventType.Event
        };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);
        repo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(42);
        eventRepo.Setup(r => r.GetGamePicksByEventAsync(1))
            .ReturnsAsync(new List<EventSessionGamePick>());

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateNextOccurrenceCommand(1), CancellationToken.None);

        Assert.Equal(42, result);
        repo.Verify(r => r.CreateEventAsync(It.Is<Event>(e =>
            e.Title == "Game Night" &&
            e.StartTime == start.AddDays(7) &&
            e.EndTime == start.AddDays(7).AddHours(4) &&
            e.SeriesParentId == 1 &&
            e.Recurrence == RecurrencePattern.Weekly)),
            Times.Once);
    }

    [Fact]
    public async Task GenerateNext_Monthly_CalculatesCorrectStartTime()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        var start = new DateTime(2025, 1, 15, 20, 0, 0, DateTimeKind.Utc);
        var ev = new Event
        {
            Id = 1,
            Title = "Monthly Meetup",
            Recurrence = RecurrencePattern.Monthly,
            RecurrenceInterval = 1,
            StartTime = start,
            Type = EventType.Event
        };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);
        repo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(50);
        eventRepo.Setup(r => r.GetGamePicksByEventAsync(1))
            .ReturnsAsync(new List<EventSessionGamePick>());

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        var result = await handler.Handle(
            new GenerateNextOccurrenceCommand(1), CancellationToken.None);

        Assert.Equal(50, result);
        repo.Verify(r => r.CreateEventAsync(It.Is<Event>(e =>
            e.StartTime == new DateTime(2025, 2, 15, 20, 0, 0, DateTimeKind.Utc))),
            Times.Once);
    }

    [Fact]
    public async Task GenerateNext_BiWeekly_Adds14Days()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        var start = new DateTime(2025, 6, 1, 10, 0, 0, DateTimeKind.Utc);
        var ev = new Event
        {
            Id = 1,
            Title = "Bi-weekly",
            Recurrence = RecurrencePattern.BiWeekly,
            StartTime = start,
            Type = EventType.Event
        };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);
        repo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(60);
        eventRepo.Setup(r => r.GetGamePicksByEventAsync(1))
            .ReturnsAsync(new List<EventSessionGamePick>());

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        await handler.Handle(new GenerateNextOccurrenceCommand(1), CancellationToken.None);

        repo.Verify(r => r.CreateEventAsync(It.Is<Event>(e =>
            e.StartTime == start.AddDays(14))), Times.Once);
    }

    [Fact]
    public async Task GenerateNext_CarriesOverUnpickedProposals()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        var start = DateTime.UtcNow;
        var ev = new Event
        {
            Id = 1,
            Title = "Carry Over",
            Recurrence = RecurrencePattern.Weekly,
            RecurrenceInterval = 1,
            StartTime = start,
            CarryOverProposals = true,
            Type = EventType.Event
        };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);
        repo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(100);

        var picks = new List<EventSessionGamePick>
        {
            new() { Id = 1, EventId = 1, BoardGameId = 10, Votes = new List<EventSessionGameVote>(), ProposedByUserId = 5, Notes = "carry me" },
            new() { Id = 2, EventId = 1, BoardGameId = 20, Votes = new List<EventSessionGameVote> { new(), new(), new() } }, // 3 votes → should NOT carry
            new() { Id = 3, EventId = 1, VideoGameId = 30, Votes = new List<EventSessionGameVote>(), ProposedByUserId = 6 }
        };
        eventRepo.Setup(r => r.GetGamePicksByEventAsync(1)).ReturnsAsync(picks);
        eventRepo.Setup(r => r.AddGamePickAsync(It.IsAny<EventSessionGamePick>())).ReturnsAsync(1);

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        await handler.Handle(new GenerateNextOccurrenceCommand(1), CancellationToken.None);

        // Should carry 2 picks (VoteCount == 0), skip 1 (VoteCount == 3)
        eventRepo.Verify(r => r.AddGamePickAsync(It.Is<EventSessionGamePick>(p =>
            p.EventId == 100 && p.BoardGameId == 10)), Times.Once);
        eventRepo.Verify(r => r.AddGamePickAsync(It.Is<EventSessionGamePick>(p =>
            p.EventId == 100 && p.VideoGameId == 30)), Times.Once);
        eventRepo.Verify(r => r.AddGamePickAsync(It.IsAny<EventSessionGamePick>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GenerateNext_SetsSeriesParentId_ToOriginalParent()
    {
        var repo = new Mock<IKaraokeRepository>();
        var eventRepo = new Mock<IEventRepository>();
        // ev is child of parent 50
        var ev = new Event
        {
            Id = 70,
            Title = "Child",
            Recurrence = RecurrencePattern.Weekly,
            RecurrenceInterval = 1,
            StartTime = DateTime.UtcNow,
            SeriesParentId = 50,
            Type = EventType.Event
        };
        repo.Setup(r => r.GetEventByIdAsync(70)).ReturnsAsync(ev);
        repo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(71);
        eventRepo.Setup(r => r.GetGamePicksByEventAsync(70))
            .ReturnsAsync(new List<EventSessionGamePick>());

        var handler = new GenerateNextOccurrenceHandler(repo.Object, eventRepo.Object);
        await handler.Handle(new GenerateNextOccurrenceCommand(70), CancellationToken.None);

        repo.Verify(r => r.CreateEventAsync(It.Is<Event>(e => e.SeriesParentId == 50)), Times.Once);
    }

    // ── CancelEventOccurrence ──

    [Fact]
    public async Task Cancel_ReturnsFalse_WhenNotFound()
    {
        var repo = new Mock<IKaraokeRepository>();
        repo.Setup(r => r.GetEventByIdAsync(999)).ReturnsAsync((Event?)null);

        var handler = new CancelEventOccurrenceHandler(repo.Object);
        var result = await handler.Handle(
            new CancelEventOccurrenceCommand(999, "test"), CancellationToken.None);

        Assert.False(result);
    }

    [Fact]
    public async Task Cancel_SetsCancellationReason()
    {
        var repo = new Mock<IKaraokeRepository>();
        var ev = new Event { Id = 1, Title = "Test" };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);
        repo.Setup(r => r.UpdateEventAsync(It.IsAny<Event>())).ReturnsAsync(true);

        var handler = new CancelEventOccurrenceHandler(repo.Object);
        var result = await handler.Handle(
            new CancelEventOccurrenceCommand(1, "Weather"), CancellationToken.None);

        Assert.True(result);
        repo.Verify(r => r.UpdateEventAsync(It.Is<Event>(e =>
            e.CancellationReason == "Weather")), Times.Once);
    }

    // ── RescheduleEventOccurrence ──

    [Fact]
    public async Task Reschedule_ReturnsFalse_WhenNotFound()
    {
        var repo = new Mock<IKaraokeRepository>();
        repo.Setup(r => r.GetEventByIdAsync(999)).ReturnsAsync((Event?)null);

        var handler = new RescheduleEventOccurrenceHandler(repo.Object);
        var result = await handler.Handle(
            new RescheduleEventOccurrenceCommand(999, DateTime.UtcNow, null),
            CancellationToken.None);

        Assert.False(result);
    }

    [Fact]
    public async Task Reschedule_SetsOriginalStartTimeAndNewDates()
    {
        var repo = new Mock<IKaraokeRepository>();
        var original = new DateTime(2025, 6, 20, 18, 0, 0, DateTimeKind.Utc);
        var newStart = new DateTime(2025, 6, 22, 19, 0, 0, DateTimeKind.Utc);
        var newEnd = new DateTime(2025, 6, 22, 23, 0, 0, DateTimeKind.Utc);
        var ev = new Event { Id = 1, Title = "Test", StartTime = original };
        repo.Setup(r => r.GetEventByIdAsync(1)).ReturnsAsync(ev);
        repo.Setup(r => r.UpdateEventAsync(It.IsAny<Event>())).ReturnsAsync(true);

        var handler = new RescheduleEventOccurrenceHandler(repo.Object);
        var result = await handler.Handle(
            new RescheduleEventOccurrenceCommand(1, newStart, newEnd),
            CancellationToken.None);

        Assert.True(result);
        repo.Verify(r => r.UpdateEventAsync(It.Is<Event>(e =>
            e.OriginalStartTime == original &&
            e.StartTime == newStart &&
            e.EndTime == newEnd)), Times.Once);
    }
}
