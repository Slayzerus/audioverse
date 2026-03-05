namespace AudioVerse.Infrastructure.Notifications
{
    /// <summary>
    /// No-op implementation of <see cref="INotificationDispatcher"/> used when RabbitMQ is disabled.
    /// Silently discards all notifications.
    /// </summary>
    public class NoOpNotificationDispatcher : INotificationDispatcher
    {
        public Task EnqueueAsync(NotificationMessage message, CancellationToken ct = default) => Task.CompletedTask;
        public Task EnqueueBatchAsync(IEnumerable<NotificationMessage> messages, CancellationToken ct = default) => Task.CompletedTask;
    }
}
