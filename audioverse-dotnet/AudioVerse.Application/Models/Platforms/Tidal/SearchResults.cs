using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class SearchResults
    {
        [JsonPropertyName("tracks")] public PagedResponse<Track>? Tracks { get; set; }
        [JsonPropertyName("albums")] public PagedResponse<Album>? Albums { get; set; }
        [JsonPropertyName("artists")] public PagedResponse<Artist>? Artists { get; set; }
        [JsonPropertyName("playlists")] public PagedResponse<Playlist>? Playlists { get; set; }
    }
}
