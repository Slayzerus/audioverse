namespace AudioVerse.Infrastructure.ExternalApis.Tmdb;

/// <summary>Client for The Movie Database (TMDB) API v3 — movies and TV shows.</summary>
public interface ITmdbClient
{
    Task<List<TmdbSearchResult>> SearchMoviesAsync(string query, int limit = 20, CancellationToken ct = default);
    Task<List<TmdbSearchResult>> SearchTvShowsAsync(string query, int limit = 20, CancellationToken ct = default);
    Task<TmdbMovieDetails?> GetMovieDetailsAsync(int tmdbId, CancellationToken ct = default);
    Task<TmdbTvShowDetails?> GetTvShowDetailsAsync(int tmdbId, CancellationToken ct = default);
}
