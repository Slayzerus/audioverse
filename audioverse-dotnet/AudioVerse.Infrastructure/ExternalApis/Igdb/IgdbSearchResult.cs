namespace AudioVerse.Infrastructure.ExternalApis.Igdb;

public class IgdbSearchResult
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public double? Rating { get; set; }
    public int? FirstReleaseDate { get; set; }
}
