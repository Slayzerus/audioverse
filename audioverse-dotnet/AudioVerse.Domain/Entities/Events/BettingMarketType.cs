namespace AudioVerse.Domain.Entities.Events;

/// <summary>Type of betting market.</summary>
public enum BettingMarketType
{
    /// <summary>Bet on the winner (1X2).</summary>
    Winner = 0,

    /// <summary>Over/Under a numeric threshold.</summary>
    OverUnder = 1,

    /// <summary>Exact score or outcome.</summary>
    ExactOutcome = 2,

    /// <summary>Custom / freeform market.</summary>
    Custom = 99
}
