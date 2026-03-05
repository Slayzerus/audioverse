namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A real-world athlete/player drafted into a fantasy team.
/// Points are awarded based on actual performance in real sporting events.
/// </summary>
public class FantasyTeamPlayer
{
    public int Id { get; set; }

    public int FantasyTeamId { get; set; }
    public FantasyTeam? FantasyTeam { get; set; }

    /// <summary>External athlete ID (from TheSportsDB or manual).</summary>
    public string? ExternalPlayerId { get; set; }

    /// <summary>Player name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Position or role (e.g. "Forward", "Goalkeeper", "Pitcher").</summary>
    public string? Position { get; set; }

    /// <summary>Real-world team name.</summary>
    public string? RealTeam { get; set; }

    /// <summary>Fantasy points earned by this player so far.</summary>
    public double Points { get; set; }

    /// <summary>Whether the player is on the active roster (vs bench).</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Draft pick order (null if free-agent pickup).</summary>
    public int? DraftOrder { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
