using Xunit;
using Moq;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Handlers.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using System.Threading.Tasks;
using System.Threading;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class UpdateKaraokePlayerStatusHandlerTests
    {
        [Fact]
        public async Task Handle_ReturnsTrue_WhenRepoSucceeds()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.UpdateKaraokePlayerStatusAsync(1, 2, KaraokePlayerStatus.Inside)).ReturnsAsync(true);

            var handler = new UpdateKaraokePlayerStatusHandler(repo.Object);
            var cmd = new UpdateKaraokePlayerStatusCommand(1, 2, KaraokePlayerStatus.Inside);
            var res = await handler.Handle(cmd, CancellationToken.None);
            Assert.True(res);
        }

        [Fact]
        public async Task Handle_ReturnsFalse_WhenRepoReturnsFalse()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.UpdateKaraokePlayerStatusAsync(1, 2, KaraokePlayerStatus.Inside)).ReturnsAsync(false);

            var handler = new UpdateKaraokePlayerStatusHandler(repo.Object);
            var cmd = new UpdateKaraokePlayerStatusCommand(1, 2, KaraokePlayerStatus.Inside);
            var res = await handler.Handle(cmd, CancellationToken.None);
            Assert.False(res);
        }
    }
}
