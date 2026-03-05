using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class VideoCategory
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("snippet")] public VideoCategorySnippet Snippet { get; set; } = new();
    }
}
