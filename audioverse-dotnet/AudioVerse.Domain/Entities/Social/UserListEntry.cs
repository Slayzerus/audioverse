using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Social;

/// <summary>
/// User's personal list / bookmark for any entity (watchlist, favorites, "want to play", etc.).
/// </summary>
public class UserListEntry
{
    public int Id { get; set; }

    /// <summary>Type of entity.</summary>
    public RateableEntityType EntityType { get; set; }

    /// <summary>Primary key of the entity.</summary>
    public int EntityId { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>List category (e.g. "favorites", "watchlist", "want-to-play", "completed", "dropped").</summary>
    public string ListName { get; set; } = "favorites";

    /// <summary>Optional personal note about this item.</summary>
    public string? Note { get; set; }

    /// <summary>Sort order within the list.</summary>
    public int SortOrder { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
