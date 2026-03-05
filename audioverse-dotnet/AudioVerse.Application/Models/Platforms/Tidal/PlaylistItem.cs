using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class PlaylistItem
    {
        [JsonPropertyName("addedAt")] public DateTimeOffset? AddedAt { get; set; }
        [JsonPropertyName("track")] public Track Track { get; set; } = new();
    }
}
