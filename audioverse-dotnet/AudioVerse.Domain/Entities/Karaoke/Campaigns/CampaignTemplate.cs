namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Szablon kampanii karaoke — definiuje strukturę (ile rund, pułapy, piosenki do wyboru).
/// Administratorzy i gracze mogą tworzyć nowe szablony.
/// </summary>
public class CampaignTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Trudność szablonu (1–5). Wpływa na mnożnik XP.</summary>
    public int Difficulty { get; set; } = 3;

    /// <summary>Czy szablon jest publiczny (widoczny dla wszystkich graczy).</summary>
    public bool IsPublic { get; set; } = true;

    /// <summary>Twórca szablonu (null = systemowy).</summary>
    public int? CreatedByPlayerId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Konfiguracja JSON (dodatkowe parametry specyficzne dla szablonu).</summary>
    public string? ConfigJson { get; set; }

    public List<CampaignTemplateRound> Rounds { get; set; } = [];
}
