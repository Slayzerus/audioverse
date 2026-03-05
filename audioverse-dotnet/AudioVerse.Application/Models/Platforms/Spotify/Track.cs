using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class Track
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("artists")] public List<Artist> Artists { get; set; } = new();
        [JsonPropertyName("album")] public Album? Album { get; set; }
        [JsonPropertyName("duration_ms")] public int DurationMs { get; set; }
        [JsonPropertyName("explicit")] public bool Explicit { get; set; }
        [JsonPropertyName("uri")] public string Uri { get; set; } = string.Empty;
        [JsonPropertyName("preview_url")] public string? PreviewUrl { get; set; }
        [JsonPropertyName("external_ids")] public Dictionary<string, string>? ExternalIds { get; set; }
    }
}
