using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class StreamUrlResponse
    {
        [JsonPropertyName("url")] public string Url { get; set; } = string.Empty;
        [JsonPropertyName("expiresAt")] public DateTimeOffset? ExpiresAt { get; set; }
        [JsonPropertyName("quality")] public string? Quality { get; set; }
        [JsonPropertyName("codec")] public string? Codec { get; set; }
    }
}
