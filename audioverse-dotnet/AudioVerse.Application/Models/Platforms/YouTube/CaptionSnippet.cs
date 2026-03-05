using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class CaptionSnippet
    {
        [JsonPropertyName("videoId")] public string VideoId { get; set; } = string.Empty;
        [JsonPropertyName("language")] public string Language { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("trackKind")] public string? TrackKind { get; set; }
    }
}
