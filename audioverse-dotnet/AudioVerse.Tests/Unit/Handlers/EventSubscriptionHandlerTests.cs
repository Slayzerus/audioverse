using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers;

public class EventSubscriptionHandlerTests
{
    // ── SubscribeToEvent ──

    [Fact]
    public async Task Subscribe_CreatesNewSubscription_WhenNotExists()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.GetAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EventSubscription?)null);
        repo.Setup(r => r.CreateAsync(It.IsAny<EventSubscription>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(10);

        var handler = new SubscribeToEventHandler(repo.Object);
        var result = await handler.Handle(
            new SubscribeToEventCommand(1, 42, EventNotificationLevel.Standard, false, true),
            CancellationToken.None);

        Assert.Equal(10, result);
        repo.Verify(r => r.CreateAsync(
            It.Is<EventSubscription>(s =>
                s.UserId == 1 && s.EventId == 42 &&
                s.Level == EventNotificationLevel.Standard &&
                s.PushEnabled),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Subscribe_ReturnsExistingId_WhenAlreadySubscribed()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        var existing = new EventSubscription { Id = 5, UserId = 1, EventId = 42 };
        repo.Setup(r => r.GetAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var handler = new SubscribeToEventHandler(repo.Object);
        var result = await handler.Handle(
            new SubscribeToEventCommand(1, 42, EventNotificationLevel.All, true, true),
            CancellationToken.None);

        Assert.Equal(5, result);
        repo.Verify(r => r.CreateAsync(It.IsAny<EventSubscription>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── UnsubscribeFromEvent ──

    [Fact]
    public async Task Unsubscribe_ReturnsTrue_WhenExists()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.DeleteAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new UnsubscribeFromEventHandler(repo.Object);
        var result = await handler.Handle(
            new UnsubscribeFromEventCommand(1, 42), CancellationToken.None);

        Assert.True(result);
    }

    [Fact]
    public async Task Unsubscribe_ReturnsFalse_WhenNotFound()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.DeleteAsync(1, 999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var handler = new UnsubscribeFromEventHandler(repo.Object);
        var result = await handler.Handle(
            new UnsubscribeFromEventCommand(1, 999), CancellationToken.None);

        Assert.False(result);
    }

    // ── ToggleEventSubscription ──

    [Fact]
    public async Task Toggle_ReturnsSubscribeState()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.ToggleAsync(1, 42, EventNotificationLevel.Standard, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new ToggleEventSubscriptionHandler(repo.Object);
        var result = await handler.Handle(
            new ToggleEventSubscriptionCommand(1, 42), CancellationToken.None);

        Assert.True(result);
    }

    // ── GetEventSubscription ──

    [Fact]
    public async Task GetSubscription_ReturnsSubscription_WhenExists()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        var sub = new EventSubscription { Id = 3, UserId = 1, EventId = 42, Level = EventNotificationLevel.All };
        repo.Setup(r => r.GetAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sub);

        var handler = new GetEventSubscriptionHandler(repo.Object);
        var result = await handler.Handle(
            new GetEventSubscriptionQuery(1, 42), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(EventNotificationLevel.All, result!.Level);
    }

    [Fact]
    public async Task GetSubscription_ReturnsNull_WhenNotFound()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.GetAsync(1, 999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EventSubscription?)null);

        var handler = new GetEventSubscriptionHandler(repo.Object);
        var result = await handler.Handle(
            new GetEventSubscriptionQuery(1, 999), CancellationToken.None);

        Assert.Null(result);
    }

    // ── IsSubscribed ──

    [Fact]
    public async Task IsSubscribed_ReturnsTrue_WhenSubscribed()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.GetAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EventSubscription { Id = 1 });

        var handler = new IsSubscribedHandler(repo.Object);
        var result = await handler.Handle(
            new IsSubscribedQuery(1, 42), CancellationToken.None);

        Assert.True(result);
    }

    [Fact]
    public async Task IsSubscribed_ReturnsFalse_WhenNotSubscribed()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.GetAsync(1, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EventSubscription?)null);

        var handler = new IsSubscribedHandler(repo.Object);
        var result = await handler.Handle(
            new IsSubscribedQuery(1, 42), CancellationToken.None);

        Assert.False(result);
    }

    // ── GetUserSubscriptions ──

    [Fact]
    public async Task GetUserSubscriptions_ReturnsList()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.GetByUserAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<EventSubscription>
            {
                new() { Id = 1, EventId = 10 },
                new() { Id = 2, EventId = 20 }
            });

        var handler = new GetUserSubscriptionsHandler(repo.Object);
        var result = await handler.Handle(
            new GetUserSubscriptionsQuery(1), CancellationToken.None);

        Assert.Equal(2, result.Count());
    }

    // ── GetEventSubscribers ──

    [Fact]
    public async Task GetEventSubscribers_ReturnsList()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.GetByEventAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<EventSubscription>
            {
                new() { UserId = 1 },
                new() { UserId = 2 },
                new() { UserId = 3 }
            });

        var handler = new GetEventSubscribersHandler(repo.Object);
        var result = await handler.Handle(
            new GetEventSubscribersQuery(42), CancellationToken.None);

        Assert.Equal(3, result.Count());
    }

    // ── SubscribeToEventList ──

    [Fact]
    public async Task SubscribeToList_ReturnsCount()
    {
        var repo = new Mock<IEventSubscriptionRepository>();
        repo.Setup(r => r.SubscribeToListEventsAsync(1, 5, EventNotificationLevel.Essential, It.IsAny<CancellationToken>()))
            .ReturnsAsync(8);

        var handler = new SubscribeToEventListHandler(repo.Object);
        var result = await handler.Handle(
            new SubscribeToEventListCommand(1, 5, EventNotificationLevel.Essential),
            CancellationToken.None);

        Assert.Equal(8, result);
    }
}
