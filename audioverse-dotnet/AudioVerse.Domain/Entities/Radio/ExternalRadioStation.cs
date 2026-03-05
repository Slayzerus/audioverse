namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Zewnętrzna stacja radiowa online (stream URL, kraj, język, gatunek).
/// Seedowana masowo — agregacja darmowych stacji z całego świata.
/// </summary>
public class ExternalRadioStation
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>URL streamu audio (mp3/aac/ogg).</summary>
    public string StreamUrl { get; set; } = string.Empty;

    /// <summary>Strona www stacji (opcjonalna).</summary>
    public string? WebsiteUrl { get; set; }

    /// <summary>URL logo/ikony stacji.</summary>
    public string? LogoUrl { get; set; }

    /// <summary>Kod kraju ISO 3166-1 alpha-2 (PL, DE, US…).</summary>
    public string CountryCode { get; set; } = string.Empty;

    /// <summary>Nazwa kraju po polsku.</summary>
    public string? CountryName { get; set; }

    /// <summary>Kod języka (pl, en, de, fr…).</summary>
    public string? Language { get; set; }

    /// <summary>Gatunek muzyczny / typ (pop, rock, news, classical…).</summary>
    public string? Genre { get; set; }

    /// <summary>Bitrate w kbps (opcjonalny).</summary>
    public int? BitrateKbps { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
