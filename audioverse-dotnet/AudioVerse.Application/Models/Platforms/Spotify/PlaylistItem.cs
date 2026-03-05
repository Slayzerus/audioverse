using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class PlaylistItem
    {
        [JsonPropertyName("added_at")] public DateTimeOffset? AddedAt { get; set; }
        [JsonPropertyName("track")] public Track Track { get; set; } = new();
    }
}
