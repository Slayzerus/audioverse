namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// A playable mode within a game (e.g. "Classic", "Timed", "Team", "Elimination").
/// Each game can have multiple modes with different rules.
/// </summary>
public class AvGameMode
{
    public int Id { get; set; }

    public int GameId { get; set; }
    public AvGame? Game { get; set; }

    /// <summary>Machine-readable code (e.g. "Timed"). Must be unique within a game.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Display name (e.g. "Timed Challenge").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Short description of how this mode differs.</summary>
    public string? Description { get; set; }

    /// <summary>Override round time for this mode (null = use game default).</summary>
    public int? RoundTimeSecondsOverride { get; set; }

    /// <summary>Mode-specific default rules / config template (JSON blob).</summary>
    public string? DefaultSettingsJson { get; set; }

    /// <summary>Sort order within the game's mode list.</summary>
    public int SortOrder { get; set; }

    /// <summary>Whether this mode is currently playable.</summary>
    public bool IsEnabled { get; set; } = true;
}
