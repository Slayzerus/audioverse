namespace AudioVerse.Infrastructure.ExternalApis.Bgg;

/// <summary>
/// Result from BoardGameGeek search.
/// </summary>
public class BggSearchResult
{
    public int BggId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? YearPublished { get; set; }
}
