namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A single bet placed by a user on a betting option.
/// Uses virtual currency (configurable pool per user/league).
/// </summary>
public class Bet
{
    public int Id { get; set; }

    public int MarketId { get; set; }
    public BettingMarket? Market { get; set; }

    public int OptionId { get; set; }
    public BettingOption? Option { get; set; }

    /// <summary>User who placed the bet.</summary>
    public int UserId { get; set; }

    /// <summary>Amount wagered (virtual currency).</summary>
    public decimal Amount { get; set; }

    /// <summary>Potential payout if the bet wins (Amount × Odds at time of bet).</summary>
    public decimal PotentialPayout { get; set; }

    /// <summary>Whether the bet won (null until market resolved).</summary>
    public bool? Won { get; set; }

    /// <summary>Actual payout credited (0 if lost, PotentialPayout if won).</summary>
    public decimal ActualPayout { get; set; }

    public DateTime PlacedAt { get; set; } = DateTime.UtcNow;
}
