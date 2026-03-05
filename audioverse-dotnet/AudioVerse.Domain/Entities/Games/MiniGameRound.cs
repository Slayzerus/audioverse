namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// A single round within a mini-game session — identifies the game, mode, and settings.
/// </summary>
public class MiniGameRound
{
    public int Id { get; set; }

    public int SessionId { get; set; }
    public MiniGameSession? Session { get; set; }

    /// <summary>Round number within the session (1-based).</summary>
    public int RoundNumber { get; set; }

    /// <summary>Mini-game identifier (e.g. "GuessTheSong", "LyricsBattle", "PitchRace").</summary>
    public string Game { get; set; } = string.Empty;

    /// <summary>Game mode variant (e.g. "Classic", "Timed", "Elimination", "Team").</summary>
    public string Mode { get; set; } = "Classic";

    /// <summary>FK to the AvGame catalog entry (null for legacy rounds).</summary>
    public int? GameId { get; set; }
    public AvGame? AvGame { get; set; }

    /// <summary>FK to the specific game mode (null for legacy rounds).</summary>
    public int? GameModeId { get; set; }
    public AvGameMode? AvGameMode { get; set; }

    /// <summary>Optional JSON blob with game-specific configuration.</summary>
    public string? SettingsJson { get; set; }

    /// <summary>How long the round lasted in seconds.</summary>
    public int? DurationSeconds { get; set; }

    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAtUtc { get; set; }

    public List<MiniGameRoundPlayer> Players { get; set; } = [];
}
