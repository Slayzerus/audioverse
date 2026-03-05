using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Postęp gracza w danej kategorii (XP, poziom).
/// Każdy gracz ma osobny rekord per kategoria.
/// </summary>
public class PlayerProgress
{
    public int Id { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    public ProgressCategory Category { get; set; }

    public int Xp { get; set; }
    public int Level { get; set; } = 1;

    /// <summary>XP potrzebne do następnego poziomu (obliczane dynamicznie, cache).</summary>
    public int XpToNextLevel { get; set; } = 100;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
