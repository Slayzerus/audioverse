using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class ResourceId
    {
        [JsonPropertyName("kind")] public string Kind { get; set; } = "youtube#video";
        [JsonPropertyName("videoId")] public string? VideoId { get; set; }
        [JsonPropertyName("channelId")] public string? ChannelId { get; set; }
        [JsonPropertyName("playlistId")] public string? PlaylistId { get; set; }
    }
}
