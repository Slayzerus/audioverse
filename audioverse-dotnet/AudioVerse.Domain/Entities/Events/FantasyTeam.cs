namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A fantasy sports team owned by a user within a fantasy league.
/// Users draft real-world athletes and earn points based on actual performance.
/// </summary>
public class FantasyTeam
{
    public int Id { get; set; }

    /// <summary>The league this fantasy team belongs to (must be LeagueType.Fantasy).</summary>
    public int LeagueId { get; set; }
    public League? League { get; set; }

    /// <summary>User who owns this fantasy team.</summary>
    public int UserId { get; set; }

    /// <summary>Team name chosen by the user.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Total fantasy points accumulated.</summary>
    public double TotalPoints { get; set; }

    /// <summary>Current rank in the league standings.</summary>
    public int? Rank { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Players drafted to this fantasy team.</summary>
    public List<FantasyTeamPlayer> Players { get; set; } = new();
}
