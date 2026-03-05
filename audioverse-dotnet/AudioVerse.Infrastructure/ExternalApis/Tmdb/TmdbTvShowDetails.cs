namespace AudioVerse.Infrastructure.ExternalApis.Tmdb;

/// <summary>Full TV show details from TMDB.</summary>
public class TmdbTvShowDetails
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? OriginalName { get; set; }
    public string? Overview { get; set; }
    public string? PosterPath { get; set; }
    public string? FirstAirDate { get; set; }
    public string? LastAirDate { get; set; }
    public int? NumberOfSeasons { get; set; }
    public int? NumberOfEpisodes { get; set; }
    public string? Status { get; set; }
    public double? VoteAverage { get; set; }
    public string? OriginalLanguage { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Networks { get; set; } = new();
}
