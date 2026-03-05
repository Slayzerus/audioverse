using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Definicja rundy w szablonie kampanii — pułap punktowy, tryb śpiewania, piosenki do wyboru.
/// </summary>
public class CampaignTemplateRound
{
    public int Id { get; set; }
    public int TemplateId { get; set; }
    public CampaignTemplate? Template { get; set; }

    /// <summary>Numer rundy (1-based, kolejność odblokowania).</summary>
    public int RoundNumber { get; set; }

    public string? Name { get; set; }

    /// <summary>Minimalny wynik (pułap) do odblokowania kolejnej rundy.</summary>
    public int ScoreThreshold { get; set; }

    /// <summary>Tryb śpiewania w tej rundzie.</summary>
    public KaraokeRoundMode SingingMode { get; set; } = KaraokeRoundMode.Normal;

    /// <summary>Ile piosenek gracz może wybrać (z puli SongPool).</summary>
    public int SongsToChoose { get; set; } = 1;

    /// <summary>Limit czasu na rundę (null = bez limitu).</summary>
    public int? TimeLimitSeconds { get; set; }

    /// <summary>ID nagrody/skill za ukończenie tej rundy (null = brak).</summary>
    public int? RewardSkillDefinitionId { get; set; }
    public SkillDefinition? RewardSkillDefinition { get; set; }

    /// <summary>Ilość XP za ukończenie rundy.</summary>
    public int XpReward { get; set; } = 50;

    /// <summary>Pula piosenek do wyboru w tej rundzie.</summary>
    public List<CampaignTemplateRoundSong> SongPool { get; set; } = [];
}
