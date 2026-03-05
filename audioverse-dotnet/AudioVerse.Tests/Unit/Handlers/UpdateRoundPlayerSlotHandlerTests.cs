using Xunit;
using Moq;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Handlers.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using System.Threading.Tasks;
using System.Threading;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class UpdateRoundPlayerSlotHandlerTests
    {
        [Fact]
        public async Task Handle_ReturnsTrue_WhenRepoSucceeds()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.UpdateRoundPlayerSlotAsync(1, 2, 3)).ReturnsAsync(true);

            var handler = new UpdateRoundPlayerSlotHandler(repo.Object);
            var cmd = new UpdateRoundPlayerSlotCommand(1, 2, 3);
            var res = await handler.Handle(cmd, CancellationToken.None);
            Assert.True(res);
        }

        [Fact]
        public async Task Handle_ReturnsFalse_WhenRepoFails()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.UpdateRoundPlayerSlotAsync(1, 2, 3)).ReturnsAsync(false);

            var handler = new UpdateRoundPlayerSlotHandler(repo.Object);
            var cmd = new UpdateRoundPlayerSlotCommand(1, 2, 3);
            var res = await handler.Handle(cmd, CancellationToken.None);
            Assert.False(res);
        }
    }
}
