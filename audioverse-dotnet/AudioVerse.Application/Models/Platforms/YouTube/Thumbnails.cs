using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class Thumbnails
    {
        [JsonPropertyName("default")] public Thumbnail? Default { get; set; }
        [JsonPropertyName("medium")] public Thumbnail? Medium { get; set; }
        [JsonPropertyName("high")] public Thumbnail? High { get; set; }
        [JsonPropertyName("standard")] public Thumbnail? Standard { get; set; }
        [JsonPropertyName("maxres")] public Thumbnail? MaxRes { get; set; }
    }
}
