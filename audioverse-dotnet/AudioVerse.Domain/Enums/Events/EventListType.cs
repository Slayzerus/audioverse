namespace AudioVerse.Domain.Enums.Events;

/// <summary>
/// Type of event list defining its purpose and behavior.
/// </summary>
public enum EventListType
{
    /// <summary>User-defined custom list.</summary>
    Custom = 0,

    /// <summary>Favorite events (one per user, auto-created).</summary>
    Favorites = 1,

    /// <summary>Events the user is watching/following.</summary>
    Watched = 2,

    /// <summary>Events grouped by location.</summary>
    ByLocation = 3,

    /// <summary>Events grouped by category/tag.</summary>
    ByCategory = 4,

    /// <summary>Archive of past events.</summary>
    Archive = 5
}
