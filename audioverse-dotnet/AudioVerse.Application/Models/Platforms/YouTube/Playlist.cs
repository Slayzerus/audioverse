using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class Playlist
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("snippet")] public PlaylistSnippet Snippet { get; set; } = new();
        [JsonPropertyName("contentDetails")] public PlaylistContentDetails? ContentDetails { get; set; }
        [JsonPropertyName("status")] public PlaylistStatus? Status { get; set; }
    }
}
