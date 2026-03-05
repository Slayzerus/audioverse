namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A league / series of events (e.g. sports league, e-sports tournament, book club season).
/// Sits between Organization (optional) and Event. A league can auto-generate a schedule
/// of events (matches/sessions) from participant lists and dates.
/// </summary>
public class League
{
    public int Id { get; set; }

    /// <summary>League name (e.g. "Premier League 2025", "Friday Film Club Season 3").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>League type — defines the kind of competition or schedule.</summary>
    public LeagueType Type { get; set; } = LeagueType.RoundRobin;

    /// <summary>Optional parent organization.</summary>
    public int? OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>Logo or badge URL.</summary>
    public string? LogoUrl { get; set; }

    /// <summary>League start date.</summary>
    public DateTime? StartDate { get; set; }

    /// <summary>League end date.</summary>
    public DateTime? EndDate { get; set; }

    /// <summary>Max number of participants/teams.</summary>
    public int? MaxParticipants { get; set; }

    /// <summary>User who created this league.</summary>
    public int? OwnerId { get; set; }

    /// <summary>Current league status.</summary>
    public LeagueStatus Status { get; set; } = LeagueStatus.Draft;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Events (matches, sessions) that belong to this league.</summary>
    public List<LeagueEvent> Events { get; set; } = new();

    /// <summary>Participants (players/teams) in this league.</summary>
    public List<LeagueParticipant> Participants { get; set; } = new();
}
