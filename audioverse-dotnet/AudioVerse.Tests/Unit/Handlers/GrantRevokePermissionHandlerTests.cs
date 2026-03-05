using Xunit;
using Moq;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Handlers.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Services.User;
using System.Threading.Tasks;
using System.Threading;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class GrantRevokePermissionHandlerTests
    {
        [Fact]
        public async Task GrantPermission_Handler_UpdatesRepo_And_Logs()
        {
            var repo = new Mock<IKaraokeRepository>();
            var audit = new Mock<IAuditLogService>();

            var existing = new KaraokeSessionPlayer { EventId = 1, PlayerId = 2, Permissions = EventPermission.None };
            repo.Setup(r => r.GetKaraokePlayerAsync(1, 2)).ReturnsAsync(existing);
            repo.Setup(r => r.UpdateEventPlayerPermissionsAsync(1, 2, It.IsAny<EventPermission>())).ReturnsAsync(true);

            var handler = new GrantPermissionHandler(repo.Object, audit.Object);
            var cmd = new GrantPermissionCommand(1, 2, EventPermission.Invite, 99);
            var res = await handler.Handle(cmd, CancellationToken.None);

            Assert.True(res);
            repo.Verify(r => r.UpdateEventPlayerPermissionsAsync(1, 2, It.Is<EventPermission>(p => (p & EventPermission.Invite) == EventPermission.Invite)), Times.Once);
            audit.Verify(a => a.LogActionAsync(99, It.IsAny<string>(), "GrantPermission", It.IsAny<string>(), true, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task RevokePermission_Handler_UpdatesRepo_And_Logs()
        {
            var repo = new Mock<IKaraokeRepository>();
            var audit = new Mock<IAuditLogService>();

            var existing = new KaraokeSessionPlayer { EventId = 1, PlayerId = 2, Permissions = EventPermission.Invite | EventPermission.Moderate };
            repo.Setup(r => r.GetKaraokePlayerAsync(1, 2)).ReturnsAsync(existing);
            repo.Setup(r => r.UpdateEventPlayerPermissionsAsync(1, 2, It.IsAny<EventPermission>())).ReturnsAsync(true);

            var handler = new RevokePermissionHandler(repo.Object, audit.Object);
            var cmd = new RevokePermissionCommand(1, 2, EventPermission.Invite, 99);
            var res = await handler.Handle(cmd, CancellationToken.None);

            Assert.True(res);
            repo.Verify(r => r.UpdateEventPlayerPermissionsAsync(1, 2, It.Is<EventPermission>(p => (p & EventPermission.Invite) == 0)), Times.Once);
            audit.Verify(a => a.LogActionAsync(99, It.IsAny<string>(), "RevokePermission", It.IsAny<string>(), true, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }
    }
}
