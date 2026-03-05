using Xunit;
using Moq;
using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Application.Handlers.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class NotificationHandlerTests
    {
        private readonly Mock<INotificationRepository> _repo = new();

        [Fact]
        public async Task SendNotification_ReturnsId()
        {
            _repo.Setup(r => r.AddAsync(It.IsAny<Notification>())).ReturnsAsync(42);

            var handler = new SendNotificationHandler(_repo.Object);
            var notification = new Notification { UserId = 1, Title = "Test", Body = "Body" };
            var result = await handler.Handle(new SendNotificationCommand(notification), CancellationToken.None);

            Assert.Equal(42, result);
            _repo.Verify(r => r.AddAsync(notification), Times.Once);
        }

        [Fact]
        public async Task DeleteNotification_ReturnsTrue()
        {
            _repo.Setup(r => r.DeleteAsync(5)).ReturnsAsync(true);

            var handler = new DeleteNotificationHandler(_repo.Object);
            var result = await handler.Handle(new DeleteNotificationCommand(5), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task DeleteNotification_NonExistent_ReturnsFalse()
        {
            _repo.Setup(r => r.DeleteAsync(999)).ReturnsAsync(false);

            var handler = new DeleteNotificationHandler(_repo.Object);
            var result = await handler.Handle(new DeleteNotificationCommand(999), CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task MarkNotificationRead_ReturnsTrue()
        {
            _repo.Setup(r => r.MarkAsReadAsync(3)).ReturnsAsync(true);

            var handler = new MarkNotificationReadHandler(_repo.Object);
            var result = await handler.Handle(new MarkNotificationReadCommand(3), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task MarkAllNotificationsRead_ReturnsCount()
        {
            _repo.Setup(r => r.MarkAllAsReadAsync(1)).ReturnsAsync(5);

            var handler = new MarkAllNotificationsReadHandler(_repo.Object);
            var result = await handler.Handle(new MarkAllNotificationsReadCommand(1), CancellationToken.None);

            Assert.Equal(5, result);
        }

        [Fact]
        public async Task GetUserNotifications_ReturnsAll()
        {
            var items = new List<Notification>
            {
                new() { Id = 1, UserId = 2, Title = "A" },
                new() { Id = 2, UserId = 2, Title = "B" }
            };
            _repo.Setup(r => r.GetByUserAsync(2, false)).ReturnsAsync(items);

            var handler = new GetUserNotificationsHandler(_repo.Object);
            var result = await handler.Handle(new GetUserNotificationsQuery(2), CancellationToken.None);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetUserNotifications_UnreadOnly()
        {
            var items = new List<Notification> { new() { Id = 1, UserId = 2, Title = "Unread" } };
            _repo.Setup(r => r.GetByUserAsync(2, true)).ReturnsAsync(items);

            var handler = new GetUserNotificationsHandler(_repo.Object);
            var result = await handler.Handle(new GetUserNotificationsQuery(2, true), CancellationToken.None);

            Assert.Single(result);
        }

        [Fact]
        public async Task GetUnreadCount_ReturnsCount()
        {
            _repo.Setup(r => r.GetUnreadCountAsync(1)).ReturnsAsync(7);

            var handler = new GetUnreadNotificationCountHandler(_repo.Object);
            var result = await handler.Handle(new GetUnreadNotificationCountQuery(1), CancellationToken.None);

            Assert.Equal(7, result);
        }
    }
}
