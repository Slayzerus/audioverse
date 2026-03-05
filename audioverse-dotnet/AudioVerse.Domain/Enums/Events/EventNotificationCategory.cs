namespace AudioVerse.Domain.Enums.Events;

/// <summary>
/// Fine-grained notification categories the user can toggle individually.
/// Stored as flags (bitmask) for compact storage.
/// </summary>
[Flags]
public enum EventNotificationCategory
{
    /// <summary>No categories selected.</summary>
    None = 0,

    /// <summary>Event cancelled or deleted.</summary>
    Cancellation = 1 << 0,

    /// <summary>Date, time, or location changed.</summary>
    DateTimeChange = 1 << 1,

    /// <summary>Reminder 24 hours before event.</summary>
    Reminder24h = 1 << 2,

    /// <summary>Reminder 1 hour before event.</summary>
    Reminder1h = 1 << 3,

    /// <summary>Schedule or agenda updated.</summary>
    ScheduleUpdate = 1 << 4,

    /// <summary>New participant joined.</summary>
    NewParticipant = 1 << 5,

    /// <summary>Organizer posted a news/hype update.</summary>
    News = 1 << 6,

    /// <summary>New comment or reply on the event.</summary>
    Comments = 1 << 7,

    /// <summary>New poll created on the event.</summary>
    Polls = 1 << 8,

    /// <summary>New photos/videos/media added.</summary>
    Media = 1 << 9,

    /// <summary>Game/song picks or voting updates.</summary>
    GameUpdates = 1 << 10,

    /// <summary>Preset: Essential = Cancellation | DateTimeChange</summary>
    PresetEssential = Cancellation | DateTimeChange,

    /// <summary>Preset: Standard = Essential + reminders + schedule</summary>
    PresetStandard = PresetEssential | Reminder24h | Reminder1h | ScheduleUpdate,

    /// <summary>Preset: All notifications</summary>
    PresetAll = PresetStandard | NewParticipant | News | Comments | Polls | Media | GameUpdates
}
