using Xunit;
using Moq;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Handlers.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using System.Threading.Tasks;
using System.Threading;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class RemovePlayerFromEventHandlerTests
    {
        [Fact]
        public async Task Handle_Removes_ReturnsTrue()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.RemovePlayerFromEventAsync(1, 2)).ReturnsAsync(true);
            var handler = new RemovePlayerFromEventHandler(repo.Object);
            var res = await handler.Handle(new RemovePlayerFromKaraokeSessionCommand(1, 2), CancellationToken.None);
            Assert.True(res);
        }

        [Fact]
        public async Task Handle_NotFound_ReturnsFalse()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.RemovePlayerFromEventAsync(1, 2)).ReturnsAsync(false);
            var handler = new RemovePlayerFromEventHandler(repo.Object);
            var res = await handler.Handle(new RemovePlayerFromKaraokeSessionCommand(1, 2), CancellationToken.None);
            Assert.False(res);
        }
    }
}
