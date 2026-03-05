using Xunit;
using Moq;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class EventHandlerTests
    {
        // --- CreateEvent ---

        [Fact]
        public async Task CreateEvent_ReturnsId()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.CreateEventAsync(It.IsAny<Event>())).ReturnsAsync(42);

            var handler = new CreateEventHandler(repo.Object);
            var ev = new Event { Title = "Test", Type = EventType.Event, StartTime = System.DateTime.UtcNow };
            var id = await handler.Handle(new CreateEventCommand(ev), CancellationToken.None);

            Assert.Equal(42, id);
            repo.Verify(r => r.CreateEventAsync(It.Is<Event>(e => e.Title == "Test")), Times.Once);
        }

        // --- GetEventById ---

        [Fact]
        public async Task GetEventById_ReturnsEvent_WhenFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            var expected = new Event { Id = 5, Title = "Found" };
            repo.Setup(r => r.GetEventByIdAsync(5)).ReturnsAsync(expected);

            var handler = new GetEventByIdHandler(repo.Object);
            var result = await handler.Handle(new GetEventByIdQuery(5), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("Found", result!.Title);
        }

        [Fact]
        public async Task GetEventById_ReturnsNull_WhenNotFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.GetEventByIdAsync(999)).ReturnsAsync((Event?)null);

            var handler = new GetEventByIdHandler(repo.Object);
            var result = await handler.Handle(new GetEventByIdQuery(999), CancellationToken.None);

            Assert.Null(result);
        }

        // --- UpdateEvent ---

        [Fact]
        public async Task UpdateEvent_ReturnsTrue_WhenSuccess()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.UpdateEventAsync(It.IsAny<Event>())).ReturnsAsync(true);

            var handler = new UpdateEventHandler(repo.Object);
            var ev = new Event { Id = 1, Title = "Updated" };
            var ok = await handler.Handle(new UpdateEventCommand(ev), CancellationToken.None);

            Assert.True(ok);
        }

        [Fact]
        public async Task UpdateEvent_ReturnsFalse_WhenNotFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.UpdateEventAsync(It.IsAny<Event>())).ReturnsAsync(false);

            var handler = new UpdateEventHandler(repo.Object);
            var ok = await handler.Handle(new UpdateEventCommand(new Event { Id = 999 }), CancellationToken.None);

            Assert.False(ok);
        }

        // --- DeleteEvent ---

        [Fact]
        public async Task DeleteEvent_ReturnsTrue_WhenDeleted()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.DeleteEventAsync(1)).ReturnsAsync(true);

            var handler = new DeleteEventHandler(repo.Object);
            var ok = await handler.Handle(new DeleteEventCommand(1), CancellationToken.None);

            Assert.True(ok);
        }

        [Fact]
        public async Task DeleteEvent_ReturnsFalse_WhenNotFound()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.DeleteEventAsync(999)).ReturnsAsync(false);

            var handler = new DeleteEventHandler(repo.Object);
            var ok = await handler.Handle(new DeleteEventCommand(999), CancellationToken.None);

            Assert.False(ok);
        }

        // --- AssignParticipantToEvent ---

        [Fact]
        public async Task AssignParticipant_CreatesParticipant_WhenNotExists()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetParticipantAsync(7, 11, It.IsAny<CancellationToken>())).ReturnsAsync((EventParticipant?)null);
            repo.Setup(r => r.AddParticipantAsync(It.IsAny<EventParticipant>(), It.IsAny<CancellationToken>())).ReturnsAsync(1);

            var handler = new AssignParticipantToEventHandler(repo.Object);
            var ok = await handler.Handle(new AssignParticipantToEventCommand(7, 11), CancellationToken.None);

            Assert.True(ok);
            repo.Verify(r => r.AddParticipantAsync(It.Is<EventParticipant>(p => p.EventId == 7 && p.UserId == 11), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task AssignParticipant_ReturnsTrue_WhenAlreadyExists()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetParticipantAsync(7, 11, It.IsAny<CancellationToken>())).ReturnsAsync(new EventParticipant { EventId = 7, UserId = 11 });

            var handler = new AssignParticipantToEventHandler(repo.Object);
            var ok = await handler.Handle(new AssignParticipantToEventCommand(7, 11), CancellationToken.None);

            Assert.True(ok);
            repo.Verify(r => r.AddParticipantAsync(It.IsAny<EventParticipant>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        // --- RemoveParticipantFromEvent ---

        [Fact]
        public async Task RemoveParticipant_ReturnsTrue_WhenRemoved()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.RemoveParticipantAsync(7, 11, It.IsAny<CancellationToken>())).ReturnsAsync(true);

            var handler = new RemoveParticipantFromEventHandler(repo.Object);
            var ok = await handler.Handle(new RemoveParticipantFromEventCommand(7, 11), CancellationToken.None);

            Assert.True(ok);
        }

        [Fact]
        public async Task RemoveParticipant_ReturnsFalse_WhenNotFound()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.RemoveParticipantAsync(7, 999, It.IsAny<CancellationToken>())).ReturnsAsync(false);

            var handler = new RemoveParticipantFromEventHandler(repo.Object);
            var ok = await handler.Handle(new RemoveParticipantFromEventCommand(7, 999), CancellationToken.None);

            Assert.False(ok);
        }

        // --- AddInviteToEvent ---

        [Fact]
        public async Task AddInvite_SetsEventId_And_ReturnsInviteId()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.AddInviteToEventAsync(It.IsAny<EventInvite>())).ReturnsAsync(55);

            var handler = new AddInviteToEventHandler(repo.Object);
            var invite = new EventInvite { FromUserId = 1, ToEmail = "a@b.com" };
            var id = await handler.Handle(new AddInviteToEventCommand(7, invite), CancellationToken.None);

            Assert.Equal(55, id);
            Assert.Equal(7, invite.EventId);
        }

        // --- AddSessionToEvent ---

        [Fact]
        public async Task AddSession_SetsEventId_And_ReturnsSessionId()
        {
            var repo = new Mock<IKaraokeRepository>();
            repo.Setup(r => r.AddSessionToEventAsync(It.IsAny<KaraokeSession>())).ReturnsAsync(99);

            var handler = new AddSessionToEventHandler(repo.Object);
            var session = new KaraokeSession { Name = "Session 1" };
            var id = await handler.Handle(new AddSessionToEventCommand(7, session), CancellationToken.None);

            Assert.Equal(99, id);
            Assert.Equal(7, session.EventId);
        }
    }
}
