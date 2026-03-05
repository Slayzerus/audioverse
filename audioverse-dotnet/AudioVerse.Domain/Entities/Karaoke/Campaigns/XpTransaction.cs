using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Log zdobytego XP — audyt skąd przyszedł XP.
/// </summary>
public class XpTransaction
{
    public int Id { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    public ProgressCategory Category { get; set; }
    public int Amount { get; set; }

    /// <summary>Źródło XP (np. "campaign_round", "singing", "achievement").</summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>ID powiązanego rekordu (kampania, singing itp.).</summary>
    public int? ReferenceId { get; set; }

    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
}
