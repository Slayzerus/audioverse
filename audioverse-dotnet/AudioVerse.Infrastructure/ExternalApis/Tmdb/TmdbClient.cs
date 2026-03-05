using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Infrastructure.ExternalApis.Tmdb;

/// <summary>TMDB API v3 client. Requires config key Tmdb:ApiKey.</summary>
public class TmdbClient : ITmdbClient
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private const string BaseUrl = "https://api.themoviedb.org/3";
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

    public TmdbClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Tmdb:ApiKey"] ?? "";
    }

    public async Task<List<TmdbSearchResult>> SearchMoviesAsync(string query, int limit = 20, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return [];
        var url = $"{BaseUrl}/search/movie?api_key={_apiKey}&query={Uri.EscapeDataString(query)}&page=1";
        var resp = await _http.GetFromJsonAsync<TmdbPagedResponse<TmdbSearchResult>>(url, JsonOpts, ct);
        return resp?.Results?.Take(limit).ToList() ?? [];
    }

    public async Task<List<TmdbSearchResult>> SearchTvShowsAsync(string query, int limit = 20, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return [];
        var url = $"{BaseUrl}/search/tv?api_key={_apiKey}&query={Uri.EscapeDataString(query)}&page=1";
        var resp = await _http.GetFromJsonAsync<TmdbPagedResponse<TmdbSearchResult>>(url, JsonOpts, ct);
        return resp?.Results?.Take(limit).ToList() ?? [];
    }

    public async Task<TmdbMovieDetails?> GetMovieDetailsAsync(int tmdbId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;
        var url = $"{BaseUrl}/movie/{tmdbId}?api_key={_apiKey}&append_to_response=credits";
        return await _http.GetFromJsonAsync<TmdbMovieDetails>(url, JsonOpts, ct);
    }

    public async Task<TmdbTvShowDetails?> GetTvShowDetailsAsync(int tmdbId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;
        var url = $"{BaseUrl}/tv/{tmdbId}?api_key={_apiKey}";
        return await _http.GetFromJsonAsync<TmdbTvShowDetails>(url, JsonOpts, ct);
    }

    private class TmdbPagedResponse<T>
    {
        [JsonPropertyName("results")]
        public List<T>? Results { get; set; }
    }
}
