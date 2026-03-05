namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A betting market for an event (match, tournament round, karaoke session).
/// Users wager virtual currency on outcomes.
/// </summary>
public class BettingMarket
{
    public int Id { get; set; }

    /// <summary>Event this market is for.</summary>
    public int EventId { get; set; }
    public Event? Event { get; set; }

    /// <summary>Optional league context.</summary>
    public int? LeagueId { get; set; }

    /// <summary>Market title (e.g. "Winner of R1M1", "Top scorer").</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Market description / rules.</summary>
    public string? Description { get; set; }

    /// <summary>Market type (Winner, OverUnder, Custom).</summary>
    public BettingMarketType Type { get; set; } = BettingMarketType.Winner;

    /// <summary>Whether the market is still open for bets.</summary>
    public bool IsOpen { get; set; } = true;

    /// <summary>The winning option ID once resolved (null if not resolved).</summary>
    public int? WinningOptionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public List<BettingOption> Options { get; set; } = new();
    public List<Bet> Bets { get; set; } = new();
}
