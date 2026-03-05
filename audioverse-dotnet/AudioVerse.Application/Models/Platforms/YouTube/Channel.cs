using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class Channel
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("snippet")] public ChannelSnippet Snippet { get; set; } = new();
        [JsonPropertyName("statistics")] public ChannelStatistics? Statistics { get; set; }
    }
}
