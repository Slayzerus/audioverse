using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>Gracz biorący udział w kampanii (solo = 1 gracz, coop = wielu).</summary>
public class CampaignPlayer
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public Campaign? Campaign { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Indywidualny łączny wynik gracza w kampanii.</summary>
    public int TotalScore { get; set; }
}
