using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Handlers.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class BoardGameSubHandlerTests
    {
        [Fact]
        public async Task AddBoardGameSession_ReturnsId()
        {
            var repo = new Mock<IGameRepository>();
            var session = new BoardGameSession { EventId = 1 };
            repo.Setup(r => r.AddBoardGameSessionAsync(session)).ReturnsAsync(42);
            var handler = new AddBoardGameSessionHandler(repo.Object);
            var result = await handler.Handle(new AddBoardGameSessionCommand(session), default);
            Assert.Equal(42, result);
        }

        [Fact]
        public async Task DeleteBoardGameSession_ReturnsTrueWhenExists()
        {
            var repo = new Mock<IGameRepository>();
            repo.Setup(r => r.DeleteBoardGameSessionAsync(1)).ReturnsAsync(true);
            var handler = new DeleteBoardGameSessionHandler(repo.Object);
            Assert.True(await handler.Handle(new DeleteBoardGameSessionCommand(1), default));
        }

        [Fact]
        public async Task DeleteBoardGameSession_ReturnsFalseWhenMissing()
        {
            var repo = new Mock<IGameRepository>();
            repo.Setup(r => r.DeleteBoardGameSessionAsync(999)).ReturnsAsync(false);
            var handler = new DeleteBoardGameSessionHandler(repo.Object);
            Assert.False(await handler.Handle(new DeleteBoardGameSessionCommand(999), default));
        }

        [Fact]
        public async Task AddBoardGameCollection_ReturnsId()
        {
            var repo = new Mock<IGameRepository>();
            var coll = new BoardGameCollection { OwnerId = 1, Name = "Test" };
            repo.Setup(r => r.AddBoardGameCollectionAsync(coll)).ReturnsAsync(10);
            var handler = new AddBoardGameCollectionHandler(repo.Object);
            var result = await handler.Handle(new AddBoardGameCollectionCommand(coll), default);
            Assert.Equal(10, result);
        }

        [Fact]
        public async Task GetBoardGameSessionsByEvent_ReturnsEmptyForUnknownEvent()
        {
            var repo = new Mock<IGameRepository>();
            repo.Setup(r => r.GetBoardGameSessionsByEventAsync(999)).ReturnsAsync(Array.Empty<BoardGameSession>());
            var handler = new GetBoardGameSessionsByEventHandler(repo.Object);
            var result = await handler.Handle(new GetBoardGameSessionsByEventQuery(999), default);
            Assert.Empty(result);
        }

        [Fact]
        public async Task UpdatePartPlayerScore_DelegatesToRepo()
        {
            var repo = new Mock<IGameRepository>();
            repo.Setup(r => r.UpdateBoardGameSessionRoundPartPlayerScoreAsync(5, 100)).ReturnsAsync(true);
            var handler = new UpdateBoardGameSessionRoundPartPlayerScoreHandler(repo.Object);
            Assert.True(await handler.Handle(new UpdateBoardGameSessionRoundPartPlayerScoreCommand(5, 100), default));
        }
    }
}
