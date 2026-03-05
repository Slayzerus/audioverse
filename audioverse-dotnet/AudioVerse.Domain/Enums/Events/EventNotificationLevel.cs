namespace AudioVerse.Domain.Enums.Events;

/// <summary>
/// Preset notification level for an event subscription.
/// Controls the default set of notifications a user receives.
/// </summary>
public enum EventNotificationLevel
{
    /// <summary>No notifications — user is on the list but has muted the event.</summary>
    Muted = 0,

    /// <summary>Only critical: cancellation, date/time change, location change.</summary>
    Essential = 1,

    /// <summary>Essential + reminders (24h, 1h before) + schedule updates.</summary>
    Standard = 2,

    /// <summary>Standard + news, hype posts, new participants, comments, polls.</summary>
    All = 3
}
