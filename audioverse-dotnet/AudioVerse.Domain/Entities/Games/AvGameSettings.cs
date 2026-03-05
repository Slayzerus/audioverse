using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Per-player settings / preferences for a specific game (1:1 per player+game).
/// Stores UI preferences, control mappings, difficulty overrides, etc.
/// </summary>
public class AvGameSettings
{
    public int Id { get; set; }

    public int GameId { get; set; }
    public AvGame? Game { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Player preferences for this game (JSON blob — controls, UI, difficulty).</summary>
    public string SettingsJson { get; set; } = "{}";

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
