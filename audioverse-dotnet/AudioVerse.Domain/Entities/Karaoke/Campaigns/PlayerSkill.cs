using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Odblokowana umiejętność gracza — instancja SkillDefinition.
/// </summary>
public class PlayerSkill
{
    public int Id { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    public int SkillDefinitionId { get; set; }
    public SkillDefinition? SkillDefinition { get; set; }

    /// <summary>ID kampanii, w której skill został odblokowany (null = odblokowany poza kampanią).</summary>
    public int? UnlockedInCampaignId { get; set; }
    public Campaign? UnlockedInCampaign { get; set; }

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Ile razy skill został użyty (do ograniczeń jednorazowych).</summary>
    public int UsageCount { get; set; }
}
