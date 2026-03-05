namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>Song metadata search result from YouTube or Spotify.</summary>
public class SongMetadataResult
{
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public string? Genre { get; set; }
    public string? Year { get; set; }
    public string Source { get; set; } = string.Empty;
    public string ExternalId { get; set; } = string.Empty;
    public int? DurationSeconds { get; set; }
}
