namespace AudioVerse.Domain.Enums;

/// <summary>Zasięg działania umiejętności gracza.</summary>
public enum SkillScope
{
    /// <summary>Działa tylko w kampanii.</summary>
    CampaignOnly = 0,

    /// <summary>Działa wszędzie (sesje, eventy).</summary>
    Global = 1
}
