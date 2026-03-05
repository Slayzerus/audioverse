namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Join table linking a League to an Event (match/session within the league).
/// Contains round/matchday info for schedule generation.
/// </summary>
public class LeagueEvent
{
    public int Id { get; set; }

    public int LeagueId { get; set; }
    public League? League { get; set; }

    public int EventId { get; set; }
    public Event? Event { get; set; }

    /// <summary>Round or matchday number (1-based).</summary>
    public int? RoundNumber { get; set; }

    /// <summary>Match number within the round.</summary>
    public int? MatchNumber { get; set; }

    /// <summary>Optional label (e.g. "Semifinal A", "Week 5").</summary>
    public string? Label { get; set; }
}
