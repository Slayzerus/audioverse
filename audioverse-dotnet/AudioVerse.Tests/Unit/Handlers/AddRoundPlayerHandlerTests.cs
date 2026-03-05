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
    public class AddRoundPlayerHandlerTests
    {
        [Fact]
        public async Task Handle_Duplicate_ReturnsExistingId()
        {
            var repo = new Mock<IKaraokeRepository>();
            var existing = new KaraokeSessionRoundPlayer { Id = 42, RoundId = 1, PlayerId = 2, Slot = 3 };
            repo.Setup(r => r.FindExistingRoundPlayerAsync(1, 2, 3)).ReturnsAsync(existing);

            var handler = new AddRoundPlayerHandler(repo.Object);
            var cmd = new AddRoundPlayerCommand(new KaraokeSessionRoundPlayer { RoundId = 1, PlayerId = 2, Slot = 3 });
            var res = await handler.Handle(cmd, CancellationToken.None);
            Assert.Equal(42, res);
        }

        [Fact]
        public async Task Handle_New_AddsAndReturnsId()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.FindExistingRoundPlayerAsync(1, 2, 3)).ReturnsAsync((KaraokeSessionRoundPlayer?)null);
            repo.Setup(r => r.CountRoundPlayersAsync(1)).ReturnsAsync(0);
            repo.Setup(r => r.AddRoundPlayerAsync(It.IsAny<KaraokeSessionRoundPlayer>())).ReturnsAsync(99);

            var handler = new AddRoundPlayerHandler(repo.Object);
            var cmd = new AddRoundPlayerCommand(new KaraokeSessionRoundPlayer { RoundId = 1, PlayerId = 2, Slot = 3 });
            var res = await handler.Handle(cmd, CancellationToken.None);
            Assert.Equal(99, res);
        }
    }
}
