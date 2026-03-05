using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class Artist
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("picture")] public Image? Picture { get; set; }
        [JsonPropertyName("popularity")] public int? Popularity { get; set; }
        [JsonPropertyName("genres")] public List<string>? Genres { get; set; }
    }
}
