using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class Album
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
        [JsonPropertyName("artists")] public List<Artist> Artists { get; set; } = new();
        [JsonPropertyName("cover")] public Image? Cover { get; set; }
        [JsonPropertyName("releaseDate")] public DateOnly? ReleaseDate { get; set; }
        [JsonPropertyName("trackCount")] public int? TrackCount { get; set; }
    }
}
