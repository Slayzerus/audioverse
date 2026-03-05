namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A selectable option within a betting market (e.g. "Team A wins", "Over 2.5 goals").
/// </summary>
public class BettingOption
{
    public int Id { get; set; }

    public int MarketId { get; set; }
    public BettingMarket? Market { get; set; }

    /// <summary>Option label (e.g. "Team A", "Draw", "Over 2.5").</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Decimal odds (e.g. 2.50 means bet 100 → win 250).</summary>
    public decimal Odds { get; set; } = 2.0m;
}
