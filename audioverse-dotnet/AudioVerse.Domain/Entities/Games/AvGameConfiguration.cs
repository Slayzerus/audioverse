namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Admin-managed configuration for a game (1:1 per AvGame).
/// Contains global rules, scoring weights, and feature toggles as a JSON blob.
/// </summary>
public class AvGameConfiguration
{
    public int Id { get; set; }

    public int GameId { get; set; }
    public AvGame? Game { get; set; }

    /// <summary>Global game configuration (JSON blob — scoring weights, timers, thresholds, feature flags).</summary>
    public string ConfigJson { get; set; } = "{}";

    /// <summary>Scoring formula or weight overrides (JSON blob).</summary>
    public string? ScoringJson { get; set; }

    /// <summary>XP multiplier for this game (1.0 = normal).</summary>
    public double XpMultiplier { get; set; } = 1.0;

    /// <summary>Admin notes about configuration changes.</summary>
    public string? Notes { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Admin user who last edited this configuration.</summary>
    public int? LastEditedByUserId { get; set; }
}
