using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers;

public class EventListHandlerTests
{
    // ── CreateEventList ──

    [Fact]
    public async Task CreateEventList_ReturnsId()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.CreateAsync(It.IsAny<EventList>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);

        var handler = new CreateEventListHandler(repo.Object);
        var id = await handler.Handle(
            new CreateEventListCommand("Weekend", "Eventy weekendowe",
                EventListType.Custom, EventListVisibility.Private,
                1, null, null, "calendar", "#FF0000"),
            CancellationToken.None);

        Assert.Equal(7, id);
        repo.Verify(r => r.CreateAsync(
            It.Is<EventList>(l =>
                l.Name == "Weekend" &&
                l.Type == EventListType.Custom &&
                l.OwnerUserId == 1 &&
                l.IconKey == "calendar"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── DeleteEventList ──

    [Fact]
    public async Task DeleteEventList_ReturnsTrue_WhenExists()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.DeleteAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new DeleteEventListHandler(repo.Object);
        var result = await handler.Handle(new DeleteEventListCommand(5), CancellationToken.None);

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteEventList_ReturnsFalse_WhenNotFound()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.DeleteAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var handler = new DeleteEventListHandler(repo.Object);
        var result = await handler.Handle(new DeleteEventListCommand(999), CancellationToken.None);

        Assert.False(result);
    }

    // ── GetEventListById ──

    [Fact]
    public async Task GetEventListById_ReturnsList_WhenFound()
    {
        var repo = new Mock<IEventListRepository>();
        var expected = new EventList { Id = 3, Name = "My List" };
        repo.Setup(r => r.GetByIdWithItemsAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var handler = new GetEventListByIdHandler(repo.Object);
        var result = await handler.Handle(new GetEventListByIdQuery(3), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("My List", result!.Name);
    }

    [Fact]
    public async Task GetEventListById_ReturnsNull_WhenNotFound()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.GetByIdWithItemsAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EventList?)null);

        var handler = new GetEventListByIdHandler(repo.Object);
        var result = await handler.Handle(new GetEventListByIdQuery(999), CancellationToken.None);

        Assert.Null(result);
    }

    // ── GetEventListByShareToken ──

    [Fact]
    public async Task GetByShareToken_ReturnsNull_WhenTokenInvalid()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.GetByShareTokenAsync("bad-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((EventList?)null);

        var handler = new GetEventListByShareTokenHandler(repo.Object);
        var result = await handler.Handle(
            new GetEventListByShareTokenQuery("bad-token"), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByShareToken_ReturnsList_WhenTokenValid()
    {
        var repo = new Mock<IEventListRepository>();
        var expected = new EventList { Id = 10, Name = "Shared List", ShareToken = "abc123" };
        repo.Setup(r => r.GetByShareTokenAsync("abc123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var handler = new GetEventListByShareTokenHandler(repo.Object);
        var result = await handler.Handle(
            new GetEventListByShareTokenQuery("abc123"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Shared List", result!.Name);
    }

    // ── GetUserEventLists ──

    [Fact]
    public async Task GetUserEventLists_ReturnsLists()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.GetByOwnerAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<EventList>
            {
                new() { Id = 1, Name = "A" },
                new() { Id = 2, Name = "B" }
            });

        var handler = new GetUserEventListsHandler(repo.Object);
        var result = await handler.Handle(new GetUserEventListsQuery(1), CancellationToken.None);

        Assert.Equal(2, result.Count());
    }

    // ── ToggleFavoriteEvent ──

    [Fact]
    public async Task ToggleFavorite_CreatesListAndAdds_WhenNoFavoritesExist()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.GetFavoritesListAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EventList?)null);
        repo.Setup(r => r.CreateAsync(It.IsAny<EventList>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(10);
        repo.Setup(r => r.IsEventInListAsync(10, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        repo.Setup(r => r.AddItemAsync(It.IsAny<EventListItem>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var handler = new ToggleFavoriteEventHandler(repo.Object);
        var result = await handler.Handle(
            new ToggleFavoriteEventCommand(1, 42), CancellationToken.None);

        Assert.True(result);
        repo.Verify(r => r.CreateAsync(
            It.Is<EventList>(l => l.Type == EventListType.Favorites && l.OwnerUserId == 1),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ToggleFavorite_Removes_WhenAlreadyFavorited()
    {
        var repo = new Mock<IEventListRepository>();
        var favorites = new EventList { Id = 5, Type = EventListType.Favorites };
        repo.Setup(r => r.GetFavoritesListAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(favorites);
        repo.Setup(r => r.IsEventInListAsync(5, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        repo.Setup(r => r.RemoveItemsBulkAsync(5, It.IsAny<IEnumerable<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var handler = new ToggleFavoriteEventHandler(repo.Object);
        var result = await handler.Handle(
            new ToggleFavoriteEventCommand(1, 42), CancellationToken.None);

        Assert.False(result);
    }

    // ── UpdateEventListItem ──

    [Fact]
    public async Task UpdateListItem_ReturnsTrue_WhenItemExists()
    {
        var repo = new Mock<IEventListRepository>();
        var item = new EventListItem { Id = 1, EventListId = 5, EventId = 10 };
        repo.Setup(r => r.GetItemByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(item);
        repo.Setup(r => r.UpdateItemAsync(It.IsAny<EventListItem>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new UpdateEventListItemHandler(repo.Object);
        var result = await handler.Handle(
            new UpdateEventListItemCommand(1, "New note", "tag1,tag2", 3),
            CancellationToken.None);

        Assert.True(result);
        repo.Verify(r => r.UpdateItemAsync(
            It.Is<EventListItem>(i => i.Note == "New note" && i.Tags == "tag1,tag2" && i.SortOrder == 3),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── IsEventInList ──

    [Fact]
    public async Task IsEventInList_ReturnsTrue_WhenExists()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.IsEventInListAsync(5, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new IsEventInListHandler(repo.Object);
        var result = await handler.Handle(
            new IsEventInListQuery(5, 42), CancellationToken.None);

        Assert.True(result);
    }

    // ── MoveEvents ──

    [Fact]
    public async Task MoveEvents_CallsRepositoryWithCorrectParams()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.MoveItemsAsync(1, 2, It.IsAny<IEnumerable<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);

        var handler = new MoveEventsHandler(repo.Object);
        var result = await handler.Handle(
            new MoveEventsCommand(1, 2, new[] { 10, 20, 30 }),
            CancellationToken.None);

        Assert.Equal(3, result);
    }

    // ── ReorderEventList ──

    [Fact]
    public async Task Reorder_CallsRepository()
    {
        var repo = new Mock<IEventListRepository>();
        repo.Setup(r => r.ReorderItemsAsync(5, It.IsAny<IEnumerable<(int, int)>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = new ReorderEventListHandler(repo.Object);
        var result = await handler.Handle(
            new ReorderEventListCommand(5, new Dictionary<int, int> { { 1, 0 }, { 2, 1 } }),
            CancellationToken.None);

        Assert.True(result);
    }
}
