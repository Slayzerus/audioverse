using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class PlaylistItemContentDetails
    {
        [JsonPropertyName("videoId")] public string VideoId { get; set; } = string.Empty;
        [JsonPropertyName("videoPublishedAt")] public DateTimeOffset? VideoPublishedAt { get; set; }
    }
}
