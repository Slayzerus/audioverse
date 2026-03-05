namespace AudioVerse.Domain.Enums.Events;

/// <summary>Recurrence pattern for recurring events.</summary>
public enum RecurrencePattern
{
    /// <summary>No recurrence — one-off event.</summary>
    None = 0,

    /// <summary>Repeats every N days.</summary>
    Daily = 1,

    /// <summary>Repeats every N weeks on the same day of week.</summary>
    Weekly = 2,

    /// <summary>Repeats every 2 weeks.</summary>
    BiWeekly = 3,

    /// <summary>Repeats every N months on the same day.</summary>
    Monthly = 4,

    /// <summary>Custom interval defined by RecurrenceInterval.</summary>
    Custom = 99
}
