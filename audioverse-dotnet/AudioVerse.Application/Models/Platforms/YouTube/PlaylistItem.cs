using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class PlaylistItem
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty; // playlistItemId
        [JsonPropertyName("snippet")] public PlaylistItemSnippet Snippet { get; set; } = new();
        [JsonPropertyName("contentDetails")] public PlaylistItemContentDetails? ContentDetails { get; set; }
    }
}
