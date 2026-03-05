using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Player participation and results in a mini-game round — score, placement, XP earned.
/// </summary>
public class MiniGameRoundPlayer
{
    public int Id { get; set; }

    public int RoundId { get; set; }
    public MiniGameRound? Round { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Player's score in this round.</summary>
    public int Score { get; set; }

    /// <summary>Placement / ranking (1 = winner).</summary>
    public int? Placement { get; set; }

    /// <summary>Whether this score is a personal best for this game+mode.</summary>
    public bool IsPersonalBest { get; set; }

    /// <summary>XP awarded for this round.</summary>
    public int XpEarned { get; set; }

    /// <summary>Optional detailed results (JSON blob, game-specific).</summary>
    public string? ResultDetailsJson { get; set; }

    public DateTime CompletedAtUtc { get; set; } = DateTime.UtcNow;
}
