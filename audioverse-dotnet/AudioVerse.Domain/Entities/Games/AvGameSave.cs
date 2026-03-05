using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Save state / progress for a specific game per player.
/// Different games store different structures — hence JSON blobs.
/// </summary>
public class AvGameSave
{
    public int Id { get; set; }

    public int GameId { get; set; }
    public AvGame? Game { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Save slot name (e.g. "autosave", "slot1", or a mode code).</summary>
    public string SlotName { get; set; } = "autosave";

    /// <summary>Save data (JSON blob — game-specific structure).</summary>
    public string DataJson { get; set; } = "{}";

    /// <summary>Optional metadata about the save (JSON blob — screenshot URL, level name, play time).</summary>
    public string? MetadataJson { get; set; }

    /// <summary>Game version this save was created with.</summary>
    public string? GameVersion { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
