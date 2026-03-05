using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A user's subscription to an event for receiving notifications.
/// Supports preset levels (Essential/Standard/All) and fine-grained category toggles.
/// Can be linked to an EventListItem or stand alone.
/// </summary>
public class EventSubscription
{
    public int Id { get; set; }

    /// <summary>Subscribing user ID.</summary>
    public int UserId { get; set; }

    /// <summary>Subscribed event ID.</summary>
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    /// <summary>Preset notification level (determines default categories).</summary>
    public EventNotificationLevel Level { get; set; } = EventNotificationLevel.Standard;

    /// <summary>
    /// Fine-grained category overrides (bitmask).
    /// If null, the preset Level determines which categories are active.
    /// If set, this overrides the preset completely.
    /// </summary>
    public EventNotificationCategory? CustomCategories { get; set; }

    /// <summary>Whether email notifications are enabled (in addition to in-app).</summary>
    public bool EmailEnabled { get; set; }

    /// <summary>Whether push notifications are enabled.</summary>
    public bool PushEnabled { get; set; } = true;

    /// <summary>Whether the 24h reminder has already been sent for this event.</summary>
    public bool Reminder24hSent { get; set; }

    /// <summary>Whether the 1h reminder has already been sent for this event.</summary>
    public bool Reminder1hSent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Resolves the effective notification categories based on Level or custom overrides.</summary>
    public EventNotificationCategory GetEffectiveCategories() =>
        CustomCategories ?? Level switch
        {
            EventNotificationLevel.Muted => EventNotificationCategory.None,
            EventNotificationLevel.Essential => EventNotificationCategory.PresetEssential,
            EventNotificationLevel.Standard => EventNotificationCategory.PresetStandard,
            EventNotificationLevel.All => EventNotificationCategory.PresetAll,
            _ => EventNotificationCategory.PresetStandard
        };
}
