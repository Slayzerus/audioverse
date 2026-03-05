using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class Image
    {
        [JsonPropertyName("url")] public string Url { get; set; } = string.Empty;
        [JsonPropertyName("width")] public int? Width { get; set; }
        [JsonPropertyName("height")] public int? Height { get; set; }
    }
}
