using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class SearchSnippet
    {
        [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
        [JsonPropertyName("channelId")] public string ChannelId { get; set; } = string.Empty;
        [JsonPropertyName("channelTitle")] public string ChannelTitle { get; set; } = string.Empty;
        [JsonPropertyName("publishedAt")] public DateTimeOffset? PublishedAt { get; set; }
        [JsonPropertyName("thumbnails")] public Thumbnails? Thumbnails { get; set; }
    }
}
