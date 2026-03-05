namespace AudioVerse.Infrastructure.ExternalApis.Bgg;

/// <summary>
/// Hot/trending game from BGG.
/// </summary>
public class BggHotGame
{
    public int Rank { get; set; }
    public int BggId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int? YearPublished { get; set; }
}
