using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class PlaylistItemSnippet
    {
        [JsonPropertyName("playlistId")] public string PlaylistId { get; set; } = string.Empty;
        [JsonPropertyName("position")] public int Position { get; set; }
        [JsonPropertyName("resourceId")] public ResourceId ResourceId { get; set; } = new();
        [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
        [JsonPropertyName("thumbnails")] public Thumbnails? Thumbnails { get; set; }
        [JsonPropertyName("channelId")] public string ChannelId { get; set; } = string.Empty;
    }
}
