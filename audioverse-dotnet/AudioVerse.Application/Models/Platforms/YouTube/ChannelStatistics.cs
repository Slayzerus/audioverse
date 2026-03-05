using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class ChannelStatistics
    {
        [JsonPropertyName("viewCount")] public string? ViewCount { get; set; }
        [JsonPropertyName("subscriberCount")] public string? SubscriberCount { get; set; }
        [JsonPropertyName("hiddenSubscriberCount")] public bool? HiddenSubscriberCount { get; set; }
        [JsonPropertyName("videoCount")] public string? VideoCount { get; set; }
    }
}
