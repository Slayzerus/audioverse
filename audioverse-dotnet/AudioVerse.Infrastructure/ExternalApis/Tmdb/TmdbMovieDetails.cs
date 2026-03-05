namespace AudioVerse.Infrastructure.ExternalApis.Tmdb;

/// <summary>Full movie details from TMDB.</summary>
public class TmdbMovieDetails
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? OriginalTitle { get; set; }
    public string? Overview { get; set; }
    public string? PosterPath { get; set; }
    public int? Runtime { get; set; }
    public string? ReleaseDate { get; set; }
    public double? VoteAverage { get; set; }
    public string? OriginalLanguage { get; set; }
    public string? ImdbId { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<TmdbCrewMember> Directors { get; set; } = new();
}
