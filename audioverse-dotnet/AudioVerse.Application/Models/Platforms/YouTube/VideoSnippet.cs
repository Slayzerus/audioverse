using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class VideoSnippet
    {
        [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
        [JsonPropertyName("channelId")] public string ChannelId { get; set; } = string.Empty;
        [JsonPropertyName("channelTitle")] public string ChannelTitle { get; set; } = string.Empty;
        [JsonPropertyName("publishedAt")] public DateTimeOffset? PublishedAt { get; set; }
        [JsonPropertyName("thumbnails")] public Thumbnails? Thumbnails { get; set; }
        [JsonPropertyName("tags")] public List<string>? Tags { get; set; }
        [JsonPropertyName("categoryId")] public string? CategoryId { get; set; }
    }
}
