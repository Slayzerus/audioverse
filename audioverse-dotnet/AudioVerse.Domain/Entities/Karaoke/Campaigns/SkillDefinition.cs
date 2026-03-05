using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Definicja umiejętności (skill) — szablon. Np. „Dodatkowa piosenka do wyboru".
/// </summary>
public class SkillDefinition
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }

    /// <summary>Zasięg: kampania / globalny.</summary>
    public SkillScope Scope { get; set; } = SkillScope.CampaignOnly;

    /// <summary>Efekt zakodowany jako klucz (np. "extra_song_choice", "score_multiplier_1.5").</summary>
    public string EffectKey { get; set; } = string.Empty;

    /// <summary>Wartość efektu (np. "1" dla dodatkowej piosenki, "1.5" dla mnożnika).</summary>
    public string? EffectValue { get; set; }

    /// <summary>Minimalny poziom gracza wymagany do odblokowania (0 = brak wymagania).</summary>
    public int RequiredLevel { get; set; }

    /// <summary>Kategoria progresu, do której skill się odnosi.</summary>
    public ProgressCategory? RequiredCategory { get; set; }
}
