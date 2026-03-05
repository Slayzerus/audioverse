using Xunit;
using Moq;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Handlers.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Services.User;
using AudioVerse.Infrastructure.Email;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class EventInviteHandlerTests
    {
        // --- SendEventInvite ---

        [Fact]
        public async Task SendInvite_PersistsInvite_And_ReturnsId()
        {
            var repo = new Mock<IKaraokeRepository>();
            var email = new Mock<IEmailSender>();
            var audit = new Mock<IAuditLogService>();

            repo.Setup(r => r.AddEventInviteAsync(It.IsAny<EventInvite>())).ReturnsAsync(10);

            var handler = new SendEventInviteHandler(repo.Object, email.Object, audit.Object);
            var invite = new EventInvite { EventId = 7, FromUserId = 1, ToEmail = "a@b.com", Message = "Hi" };
            var id = await handler.Handle(new SendEventInviteCommand(invite), CancellationToken.None);

            Assert.Equal(10, id);
            repo.Verify(r => r.AddEventInviteAsync(It.Is<EventInvite>(i => i.EventId == 7)), Times.Once);
        }

        [Fact]
        public async Task SendInvite_SendsEmail_WhenToEmailProvided()
        {
            var repo = new Mock<IKaraokeRepository>();
            var email = new Mock<IEmailSender>();
            var audit = new Mock<IAuditLogService>();

            repo.Setup(r => r.AddEventInviteAsync(It.IsAny<EventInvite>())).ReturnsAsync(10);

            var handler = new SendEventInviteHandler(repo.Object, email.Object, audit.Object);
            var invite = new EventInvite { EventId = 7, FromUserId = 1, ToEmail = "guest@test.com", Message = "Join!" };
            await handler.Handle(new SendEventInviteCommand(invite), CancellationToken.None);

            email.Verify(e => e.SendAsync("guest@test.com", It.IsAny<string>(), It.IsAny<string>(), true), Times.Once);
        }

        [Fact]
        public async Task SendInvite_NoEmail_WhenToEmailNull()
        {
            var repo = new Mock<IKaraokeRepository>();
            var email = new Mock<IEmailSender>();
            var audit = new Mock<IAuditLogService>();

            repo.Setup(r => r.AddEventInviteAsync(It.IsAny<EventInvite>())).ReturnsAsync(10);

            var handler = new SendEventInviteHandler(repo.Object, email.Object, audit.Object);
            var invite = new EventInvite { EventId = 7, FromUserId = 1, ToUserId = 5 };
            await handler.Handle(new SendEventInviteCommand(invite), CancellationToken.None);

            email.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
        }

        // --- CancelEventInvite ---

        [Fact]
        public async Task CancelInvite_ReturnsTrue_WhenSuccess()
        {
            var repo = new Mock<IKaraokeRepository>();
            var audit = new Mock<IAuditLogService>();

            repo.Setup(r => r.GetEventInviteByIdAsync(5)).ReturnsAsync(new EventInvite { Id = 5, EventId = 7, Status = EventInviteStatus.Pending });
            repo.Setup(r => r.UpdateEventInviteAsync(It.IsAny<EventInvite>())).ReturnsAsync(true);

            var handler = new CancelEventInviteHandler(repo.Object, audit.Object);
            var ok = await handler.Handle(new CancelEventInviteCommand(5, 99), CancellationToken.None);

            Assert.True(ok);
            repo.Verify(r => r.UpdateEventInviteAsync(It.Is<EventInvite>(i => i.Status == EventInviteStatus.Cancelled)), Times.Once);
        }

        [Fact]
        public async Task CancelInvite_ReturnsFalse_WhenNotFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            var audit = new Mock<IAuditLogService>();

            repo.Setup(r => r.GetEventInviteByIdAsync(999)).ReturnsAsync((EventInvite?)null);

            var handler = new CancelEventInviteHandler(repo.Object, audit.Object);
            var ok = await handler.Handle(new CancelEventInviteCommand(999, 99), CancellationToken.None);

            Assert.False(ok);
        }

        // --- RespondToEventInvite ---

        [Fact]
        public async Task Respond_Accept_SetsStatusAccepted_And_AssignsPlayer()
        {
            var repo = new Mock<IKaraokeRepository>();
            var invite = new EventInvite { Id = 1, EventId = 7, ToUserId = 11, Status = EventInviteStatus.Pending };
            repo.Setup(r => r.GetEventInviteByIdAsync(1)).ReturnsAsync(invite);
            repo.Setup(r => r.UpdateEventInviteAsync(It.IsAny<EventInvite>())).ReturnsAsync(true);
            repo.Setup(r => r.AssignPlayerToEventAsync(It.IsAny<KaraokeSessionPlayer>())).ReturnsAsync(true);

            var handler = new RespondToEventInviteHandler(repo.Object);
            var ok = await handler.Handle(new RespondToEventInviteCommand(1, true), CancellationToken.None);

            Assert.True(ok);
            Assert.Equal(EventInviteStatus.Accepted, invite.Status);
            repo.Verify(r => r.AssignPlayerToEventAsync(It.Is<KaraokeSessionPlayer>(p => p.EventId == 7 && p.PlayerId == 11)), Times.Once);
        }

        [Fact]
        public async Task Respond_Decline_SetsStatusDeclined_DoesNotAssign()
        {
            var repo = new Mock<IKaraokeRepository>();
            var invite = new EventInvite { Id = 1, EventId = 7, ToUserId = 11, Status = EventInviteStatus.Pending };
            repo.Setup(r => r.GetEventInviteByIdAsync(1)).ReturnsAsync(invite);
            repo.Setup(r => r.UpdateEventInviteAsync(It.IsAny<EventInvite>())).ReturnsAsync(true);

            var handler = new RespondToEventInviteHandler(repo.Object);
            var ok = await handler.Handle(new RespondToEventInviteCommand(1, false), CancellationToken.None);

            Assert.True(ok);
            Assert.Equal(EventInviteStatus.Declined, invite.Status);
            repo.Verify(r => r.AssignPlayerToEventAsync(It.IsAny<KaraokeSessionPlayer>()), Times.Never);
        }

        [Fact]
        public async Task Respond_ReturnsFalse_WhenInviteNotFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.GetEventInviteByIdAsync(999)).ReturnsAsync((EventInvite?)null);

            var handler = new RespondToEventInviteHandler(repo.Object);
            var ok = await handler.Handle(new RespondToEventInviteCommand(999, true), CancellationToken.None);

            Assert.False(ok);
        }

        // --- GetEventInviteById ---

        [Fact]
        public async Task GetInviteById_ReturnsInvite_WhenFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            var expected = new EventInvite { Id = 3, EventId = 7, ToEmail = "a@b.com" };
            repo.Setup(r => r.GetEventInviteByIdAsync(3)).ReturnsAsync(expected);

            var handler = new GetEventInviteByIdHandler(repo.Object);
            var result = await handler.Handle(new GetEventInviteByIdQuery(3), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(7, result!.EventId);
        }

        [Fact]
        public async Task GetInviteById_ReturnsNull_WhenNotFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.GetEventInviteByIdAsync(999)).ReturnsAsync((EventInvite?)null);

            var handler = new GetEventInviteByIdHandler(repo.Object);
            var result = await handler.Handle(new GetEventInviteByIdQuery(999), CancellationToken.None);

            Assert.Null(result);
        }
    }
}
