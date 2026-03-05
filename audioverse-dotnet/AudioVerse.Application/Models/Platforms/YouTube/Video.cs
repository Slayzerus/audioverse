using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class Video
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("snippet")] public VideoSnippet Snippet { get; set; } = new();
        [JsonPropertyName("contentDetails")] public VideoContentDetails? ContentDetails { get; set; }
        [JsonPropertyName("statistics")] public VideoStatistics? Statistics { get; set; }
    }
}
