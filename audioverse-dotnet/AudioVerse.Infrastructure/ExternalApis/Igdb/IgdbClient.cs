using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.ExternalApis.Igdb;

/// <summary>
/// IGDB API v4 client using Twitch OAuth2 client credentials.
/// Requires config: Igdb:ClientId, Igdb:ClientSecret
/// </summary>
public class IgdbClient : IIgdbClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<IgdbClient> _logger;
    private string? _accessToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public IgdbClient(HttpClient http, IConfiguration config, ILogger<IgdbClient> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
        _http.BaseAddress = new Uri("https://api.igdb.com/v4/");
    }

    public async Task<List<IgdbSearchResult>> SearchAsync(string query, int limit = 10, CancellationToken ct = default)
    {
        if (!await EnsureTokenAsync(ct)) return new();

        var body = $"search \"{query}\"; fields name,cover.url,rating,first_release_date; limit {limit};";
        var request = new HttpRequestMessage(HttpMethod.Post, "games") { Content = new StringContent(body) };
        SetHeaders(request);

        var resp = await _http.SendAsync(request, ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("IGDB search failed: {Status}", resp.StatusCode);
            return new();
        }

        var json = await resp.Content.ReadFromJsonAsync<JsonElement[]>(ct) ?? [];
        return json.Select(g => new IgdbSearchResult
        {
            Id = g.GetProperty("id").GetInt32(),
            Name = g.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            CoverUrl = g.TryGetProperty("cover", out var c) && c.TryGetProperty("url", out var u) ? "https:" + u.GetString() : null,
            Rating = g.TryGetProperty("rating", out var r) ? r.GetDouble() : null,
            FirstReleaseDate = g.TryGetProperty("first_release_date", out var d) ? d.GetInt32() : null
        }).ToList();
    }

    public async Task<IgdbGameDetails?> GetByIdAsync(int igdbId, CancellationToken ct = default)
    {
        if (!await EnsureTokenAsync(ct)) return null;

        var body = $"where id = {igdbId}; fields name,summary,cover.url,rating,first_release_date,genres.name,platforms.name,multiplayer_modes.*;";
        var request = new HttpRequestMessage(HttpMethod.Post, "games") { Content = new StringContent(body) };
        SetHeaders(request);

        var resp = await _http.SendAsync(request, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var json = await resp.Content.ReadFromJsonAsync<JsonElement[]>(ct) ?? [];
        if (json.Length == 0) return null;

        var g = json[0];
        return new IgdbGameDetails
        {
            Id = g.GetProperty("id").GetInt32(),
            Name = g.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            Summary = g.TryGetProperty("summary", out var s) ? s.GetString() : null,
            CoverUrl = g.TryGetProperty("cover", out var c) && c.TryGetProperty("url", out var u) ? "https:" + u.GetString() : null,
            Rating = g.TryGetProperty("rating", out var r) ? r.GetDouble() : null,
            FirstReleaseDate = g.TryGetProperty("first_release_date", out var d) ? d.GetInt32() : null,
            Genres = g.TryGetProperty("genres", out var genres) ? genres.EnumerateArray().Select(x => x.TryGetProperty("name", out var gn) ? gn.GetString() ?? "" : "").ToList() : new(),
            Platforms = g.TryGetProperty("platforms", out var plats) ? plats.EnumerateArray().Select(x => x.TryGetProperty("name", out var pn) ? pn.GetString() ?? "" : "").ToList() : new()
        };
    }

    private void SetHeaders(HttpRequestMessage req)
    {
        req.Headers.Add("Client-ID", _config["Igdb:ClientId"]);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
    }

    private async Task<bool> EnsureTokenAsync(CancellationToken ct)
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry) return true;

        var clientId = _config["Igdb:ClientId"];
        var clientSecret = _config["Igdb:ClientSecret"];
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            _logger.LogWarning("IGDB credentials not configured");
            return false;
        }

        using var tokenHttp = new HttpClient();
        var tokenResp = await tokenHttp.PostAsync(
            $"https://id.twitch.tv/oauth2/token?client_id={clientId}&client_secret={clientSecret}&grant_type=client_credentials",
            null, ct);

        if (!tokenResp.IsSuccessStatusCode) return false;

        var tokenJson = await tokenResp.Content.ReadFromJsonAsync<JsonElement>(ct);
        _accessToken = tokenJson.GetProperty("access_token").GetString();
        var expiresIn = tokenJson.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);
        return true;
    }
}
