using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Application.Services.Events;

/// <summary>
/// Service for dispatching notifications to event subscribers
/// based on their notification level and category preferences.
/// </summary>
public interface IEventNotificationService
{
    /// <summary>Send notification to all subscribers of an event that have a given category enabled.</summary>
    Task NotifySubscribersAsync(int eventId, EventNotificationCategory category,
        string title, string body, NotificationType type, CancellationToken ct = default);

    /// <summary>Process pending 24h and 1h reminders for upcoming events.</summary>
    Task ProcessRemindersAsync(CancellationToken ct = default);
}
