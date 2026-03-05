using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class VideoContentDetails
    {
        [JsonPropertyName("duration")] public string DurationIso8601 { get; set; } = string.Empty; // e.g. PT3M21S
        [JsonPropertyName("dimension")] public string? Dimension { get; set; }
        [JsonPropertyName("definition")] public string? Definition { get; set; }
        [JsonPropertyName("caption")] public string? Caption { get; set; }
        [JsonPropertyName("licensedContent")] public bool? LicensedContent { get; set; }
    }
}
