using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Social;

/// <summary>
/// Universal user-applied tag on any entity.
/// Multiple tags per player per entity allowed.
/// </summary>
public class UserTag
{
    public int Id { get; set; }

    /// <summary>Type of entity being tagged.</summary>
    public RateableEntityType EntityType { get; set; }

    /// <summary>Primary key of the tagged entity.</summary>
    public int EntityId { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Tag value (lowercase, trimmed). E.g. "fun", "hard", "classic", "romantic".</summary>
    public string Tag { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
