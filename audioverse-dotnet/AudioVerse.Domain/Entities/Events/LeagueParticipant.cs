namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A participant (player or team) in a league.
/// Tracks standings (wins, losses, points, etc.).
/// </summary>
public class LeagueParticipant
{
    public int Id { get; set; }

    public int LeagueId { get; set; }
    public League? League { get; set; }

    /// <summary>User ID of the participant (null if team-based).</summary>
    public int? UserId { get; set; }

    /// <summary>Team/display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Seed number for bracket tournaments.</summary>
    public int? Seed { get; set; }

    /// <summary>Wins count.</summary>
    public int Wins { get; set; }

    /// <summary>Losses count.</summary>
    public int Losses { get; set; }

    /// <summary>Draws count.</summary>
    public int Draws { get; set; }

    /// <summary>Total points (configurable scoring).</summary>
    public int Points { get; set; }

    /// <summary>Whether this participant has been eliminated.</summary>
    public bool IsEliminated { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
