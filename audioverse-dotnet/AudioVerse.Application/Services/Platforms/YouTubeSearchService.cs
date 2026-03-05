using AudioVerse.Application.Models.Audio;
using System.Net.Http.Json;
using System.Text.Json;

namespace AudioVerse.Application.Services.Platforms
{
    public class YouTubeSearchService : IYouTubeSearchService
    {
        private readonly HttpClient _http;
        private readonly YouTubeServiceOptions _options;

        public YouTubeSearchService(HttpClient http, Microsoft.Extensions.Options.IOptions<YouTubeServiceOptions> options)
        {
            _http = http;
            _options = options.Value;
        }

        public async Task<IReadOnlyList<ExternalTrackResult>> SearchAsync(string query, int limit = 10, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(_options.ApiKey))
            {
                try
                {
                    var resp = await _http.GetAsync($"https://noembed.com/embed?url=https://www.youtube.com/watch?v={Uri.EscapeDataString(query)}", ct);
                    if (!resp.IsSuccessStatusCode) return Array.Empty<ExternalTrackResult>();
                    var json = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
                    return new[] { new ExternalTrackResult
                    {
                        ExternalId = query,
                        Source = "YouTube",
                        Title = json.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                        Artist = json.TryGetProperty("author_name", out var a) ? a.GetString() ?? "" : "",
                        CoverUrl = json.TryGetProperty("thumbnail_url", out var c) ? c.GetString() : null
                    }};
                }
                catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return Array.Empty<ExternalTrackResult>(); }
            }

            var url = $"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={Uri.EscapeDataString(query)}&maxResults={limit}&key={_options.ApiKey}";
            var response = await _http.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return Array.Empty<ExternalTrackResult>();
            var body = await response.Content.ReadFromJsonAsync<JsonElement>(ct);
            var results = new List<ExternalTrackResult>();
            foreach (var item in body.GetProperty("items").EnumerateArray())
            {
                var snippet = item.GetProperty("snippet");
                results.Add(new ExternalTrackResult
                {
                    ExternalId = item.GetProperty("id").GetProperty("videoId").GetString() ?? "",
                    Source = "YouTube",
                    Title = snippet.GetProperty("title").GetString() ?? "",
                    Artist = snippet.GetProperty("channelTitle").GetString() ?? "",
                    CoverUrl = snippet.TryGetProperty("thumbnails", out var th) && th.TryGetProperty("high", out var h) ? h.GetProperty("url").GetString() : null
                });
            }
            return results;
        }
    }
}
