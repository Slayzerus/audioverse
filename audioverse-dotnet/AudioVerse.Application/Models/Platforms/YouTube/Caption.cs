using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class Caption
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("snippet")] public CaptionSnippet Snippet { get; set; } = new();
    }
}
