using System.Net.Http.Json;

namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>YouTube (oEmbed) + Spotify (OAuth client_credentials) metadata client.</summary>
public class SongMetadataClient : ISongMetadataClient
{
    private readonly HttpClient _http;
    private readonly Microsoft.Extensions.Configuration.IConfiguration? _config;
    private string? _spotifyToken;
    private DateTime _spotifyTokenExpiry = DateTime.MinValue;

    public SongMetadataClient(HttpClient http, Microsoft.Extensions.Configuration.IConfiguration? config = null)
    {
        _http = http;
        _config = config;
    }

    public async Task<SongMetadataResult?> SearchYouTubeAsync(string query)
    {
        try
        {
            var resp = await _http.GetAsync($"https://noembed.com/embed?url=https://www.youtube.com/watch?v={Uri.EscapeDataString(query)}");
            if (!resp.IsSuccessStatusCode) return null;
            var json = await resp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            return new SongMetadataResult
            {
                Title = json.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                Artist = json.TryGetProperty("author_name", out var a) ? a.GetString() ?? "" : "",
                CoverUrl = json.TryGetProperty("thumbnail_url", out var c) ? c.GetString() : null,
                Source = "YouTube",
                ExternalId = query
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return null; }
    }

    public async Task<SongMetadataResult?> GetYouTubeVideoAsync(string videoId)
    {
        try
        {
            var resp = await _http.GetAsync($"https://noembed.com/embed?url=https://www.youtube.com/watch?v={Uri.EscapeDataString(videoId)}");
            if (!resp.IsSuccessStatusCode) return null;
            var json = await resp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            return new SongMetadataResult
            {
                Title = json.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                Artist = json.TryGetProperty("author_name", out var a) ? a.GetString() ?? "" : "",
                CoverUrl = json.TryGetProperty("thumbnail_url", out var c) ? c.GetString() : null,
                Source = "YouTube",
                ExternalId = videoId
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return null; }
    }

    public async Task<SongMetadataResult?> SearchSpotifyAsync(string query)
    {
        if (!await EnsureSpotifyTokenAsync()) return null;

        try
        {
            var market = _config?["Spotify:Market"] ?? "PL";
            var req = new HttpRequestMessage(HttpMethod.Get,
                $"https://api.spotify.com/v1/search?q={Uri.EscapeDataString(query)}&type=track&limit=1&market={market}");
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _spotifyToken);

            var resp = await _http.SendAsync(req);
            if (!resp.IsSuccessStatusCode) return null;

            var json = await resp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            var items = json.GetProperty("tracks").GetProperty("items");
            if (items.GetArrayLength() == 0) return null;

            var track = items[0];
            var artists = track.GetProperty("artists").EnumerateArray()
                .Select(a => a.GetProperty("name").GetString() ?? "").ToList();
            var album = track.GetProperty("album");

            return new SongMetadataResult
            {
                Title = track.GetProperty("name").GetString() ?? "",
                Artist = string.Join(", ", artists),
                CoverUrl = album.TryGetProperty("images", out var imgs) && imgs.GetArrayLength() > 0
                    ? imgs[0].GetProperty("url").GetString() : null,
                Year = album.TryGetProperty("release_date", out var rd) ? rd.GetString()?[..4] : null,
                Source = "Spotify",
                ExternalId = track.GetProperty("id").GetString() ?? "",
                DurationSeconds = track.TryGetProperty("duration_ms", out var dur) ? dur.GetInt32() / 1000 : null
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return null; }
    }

    private async Task<bool> EnsureSpotifyTokenAsync()
    {
        if (_spotifyToken != null && DateTime.UtcNow < _spotifyTokenExpiry) return true;

        var clientId = _config?["Spotify:ClientId"];
        var clientSecret = _config?["Spotify:ClientSecret"];
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret)) return false;

        try
        {
            var authValue = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
            var tokenReq = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
            tokenReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);
            tokenReq.Content = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("grant_type", "client_credentials") });

            var resp = await _http.SendAsync(tokenReq);
            if (!resp.IsSuccessStatusCode) return false;

            var json = await resp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            _spotifyToken = json.GetProperty("access_token").GetString();
            var expiresIn = json.GetProperty("expires_in").GetInt32();
            _spotifyTokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);
            return true;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return false; }
    }
}
