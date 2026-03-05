using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for event subscriptions (notification preferences).
/// </summary>
public interface IEventSubscriptionRepository
{
    Task<EventSubscription?> GetAsync(int userId, int eventId, CancellationToken ct = default);
    Task<EventSubscription?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<EventSubscription>> GetByUserAsync(int userId, CancellationToken ct = default);
    Task<IEnumerable<EventSubscription>> GetByEventAsync(int eventId, CancellationToken ct = default);

    /// <summary>Gets all subscribers for an event that have a specific category enabled.</summary>
    Task<IEnumerable<EventSubscription>> GetSubscribersForCategoryAsync(int eventId, EventNotificationCategory category, CancellationToken ct = default);

    /// <summary>Gets subscriptions needing 24h reminder (event starts within 24-23h, not yet sent).</summary>
    Task<IEnumerable<EventSubscription>> GetPendingReminders24hAsync(CancellationToken ct = default);

    /// <summary>Gets subscriptions needing 1h reminder (event starts within 60-59min, not yet sent).</summary>
    Task<IEnumerable<EventSubscription>> GetPendingReminders1hAsync(CancellationToken ct = default);

    Task<int> CreateAsync(EventSubscription subscription, CancellationToken ct = default);
    Task<bool> UpdateAsync(EventSubscription subscription, CancellationToken ct = default);
    Task<bool> DeleteAsync(int userId, int eventId, CancellationToken ct = default);

    /// <summary>Subscribe/unsubscribe toggle — returns true if now subscribed.</summary>
    Task<bool> ToggleAsync(int userId, int eventId, EventNotificationLevel defaultLevel = EventNotificationLevel.Standard, CancellationToken ct = default);

    Task MarkReminderSentAsync(int subscriptionId, bool is24h, CancellationToken ct = default);

    /// <summary>Bulk subscribe a user to all events in an EventList.</summary>
    Task<int> SubscribeToListEventsAsync(int userId, int eventListId, EventNotificationLevel level, CancellationToken ct = default);
}
