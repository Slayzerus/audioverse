namespace AudioVerse.Infrastructure.ExternalApis.Tmdb;

/// <summary>Lightweight search result from TMDB (movies or TV shows).</summary>
public class TmdbSearchResult
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? OriginalTitle { get; set; }
    public string? PosterPath { get; set; }
    public string? Overview { get; set; }
    public double? VoteAverage { get; set; }
    public string? ReleaseDate { get; set; }
}
