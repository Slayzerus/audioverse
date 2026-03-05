using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class RecommendationsResponse
    {
        [JsonPropertyName("tracks")] public List<Track> Tracks { get; set; } = new();
        [JsonPropertyName("seeds")] public List<object>? Seeds { get; set; }
    }
}
