using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class Playlist
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string? Description { get; set; }
        [JsonPropertyName("ownerUserId")] public string? OwnerUserId { get; set; }
        [JsonPropertyName("images")] public List<Image>? Images { get; set; }
        [JsonPropertyName("tracks")] public PagedResponse<PlaylistItem>? Tracks { get; set; }
        [JsonPropertyName("public")] public bool? Public { get; set; }
    }
}
