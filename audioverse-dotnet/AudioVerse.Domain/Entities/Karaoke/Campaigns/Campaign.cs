using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Instancja kampanii gracza — konkretne „przejście" szablonu kampanii.
/// Jeden gracz może mieć wiele kampanii (nawet tego samego szablonu).
/// </summary>
public class Campaign
{
    public int Id { get; set; }

    public int TemplateId { get; set; }
    public CampaignTemplate? Template { get; set; }

    /// <summary>Tryb współpracy (solo / wszyscy muszą / wystarczy jeden).</summary>
    public CampaignCoopMode CoopMode { get; set; } = CampaignCoopMode.Solo;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    /// <summary>Bieżąca odblokowana runda (1-based).</summary>
    public int CurrentRound { get; set; } = 1;

    /// <summary>Łączny wynik ze wszystkich rund.</summary>
    public int TotalScore { get; set; }

    /// <summary>Łączny zdobyty XP w tej kampanii.</summary>
    public int TotalXpEarned { get; set; }

    public List<CampaignPlayer> Players { get; set; } = [];
    public List<CampaignRoundProgress> RoundProgress { get; set; } = [];
}
