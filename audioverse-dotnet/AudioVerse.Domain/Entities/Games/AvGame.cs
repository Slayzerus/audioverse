using AudioVerse.Domain.Enums.Games;

namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Universal game definition — covers mini-games, party games, and full-size games.
/// Acts as a single catalog for all playable activities in the system.
/// </summary>
public class AvGame
{
    public int Id { get; set; }

    /// <summary>Display name (e.g. "Guess The Song").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Unique machine-readable code (e.g. "GuessTheSong"). Used as stable identifier across versions.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Markdown-capable description shown to players.</summary>
    public string? Description { get; set; }

    /// <summary>Whether this game is a quick mini-game (vs. a full/large game).</summary>
    public bool IsMiniGame { get; set; }

    // ── Player limits ──

    /// <summary>Minimum players for versus / competitive mode.</summary>
    public int VsPlayersMinimum { get; set; } = 1;

    /// <summary>Maximum players for versus / competitive mode.</summary>
    public int VsPlayersMaximum { get; set; } = 8;

    /// <summary>Minimum players for cooperative mode.</summary>
    public int CoopPlayersMinimum { get; set; } = 1;

    /// <summary>Maximum players for cooperative mode.</summary>
    public int CoopPlayersMaximum { get; set; } = 4;

    // ── Visual ──

    /// <summary>Icon name (Lucide / Feather icon key).</summary>
    public string? Icon { get; set; }

    /// <summary>Cover image URL or storage key.</summary>
    public string? ImageUrl { get; set; }

    // ── Classification ──

    /// <summary>Game category / genre.</summary>
    public AvGameCategory Category { get; set; } = AvGameCategory.MiniGame;

    /// <summary>Default difficulty level.</summary>
    public AvGameDifficulty Difficulty { get; set; } = AvGameDifficulty.Medium;

    /// <summary>How complex the game is to learn.</summary>
    public AvGameComplexity Complexity { get; set; } = AvGameComplexity.Simple;

    /// <summary>Suggested round time in seconds (null = no limit).</summary>
    public int? RoundTimeSeconds { get; set; }

    /// <summary>Estimated total play time in minutes.</summary>
    public int? EstimatedDurationMinutes { get; set; }

    // ── Flags ──

    /// <summary>Whether the game supports cooperative mode.</summary>
    public bool SupportsCoop { get; set; }

    /// <summary>Whether the game supports versus / competitive mode.</summary>
    public bool SupportsVs { get; set; } = true;

    /// <summary>Whether the game supports solo play.</summary>
    public bool SupportsSolo { get; set; }

    /// <summary>Whether the game is currently enabled and visible.</summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>Sort order in game lists (lower = first).</summary>
    public int SortOrder { get; set; }

    // ── Metadata ──

    /// <summary>Comma-separated tags for search and filtering.</summary>
    public string? Tags { get; set; }

    /// <summary>Semantic version of the game logic (e.g. "1.2.0").</summary>
    public string? Version { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // ── Navigation ──

    public AvGameConfiguration? Configuration { get; set; }
    public List<AvGameMode> Modes { get; set; } = [];
    public List<AvGameAsset> Assets { get; set; } = [];
    public List<AvGameAchievement> Achievements { get; set; } = [];
}
