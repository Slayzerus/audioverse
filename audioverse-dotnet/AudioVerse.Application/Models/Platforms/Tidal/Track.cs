using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class Track
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
        [JsonPropertyName("artists")] public List<Artist> Artists { get; set; } = new();
        [JsonPropertyName("album")] public Album? Album { get; set; }
        [JsonPropertyName("durationMs")] public int? DurationMs { get; set; }
        [JsonPropertyName("explicit")] public bool? Explicit { get; set; }
        [JsonPropertyName("isrc")] public string? Isrc { get; set; }
    }
}
