namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// Dispatches notifications to the RabbitMQ queue for async processing.
/// </summary>
public interface INotificationDispatcher
{
    Task EnqueueAsync(NotificationMessage message, CancellationToken ct = default);
    Task EnqueueBatchAsync(IEnumerable<NotificationMessage> messages, CancellationToken ct = default);
}
