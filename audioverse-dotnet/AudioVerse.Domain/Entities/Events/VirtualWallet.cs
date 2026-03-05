namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Virtual currency wallet for a user (per league or global).
/// Each user starts with a configurable balance.
/// </summary>
public class VirtualWallet
{
    public int Id { get; set; }

    public int UserId { get; set; }

    /// <summary>Optional league scope (null = global wallet).</summary>
    public int? LeagueId { get; set; }

    /// <summary>Current balance of virtual currency.</summary>
    public decimal Balance { get; set; } = 1000m;

    /// <summary>Total amount ever wagered.</summary>
    public decimal TotalWagered { get; set; }

    /// <summary>Total winnings collected.</summary>
    public decimal TotalWon { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
