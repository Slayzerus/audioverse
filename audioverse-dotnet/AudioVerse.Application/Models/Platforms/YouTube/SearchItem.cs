using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class SearchItem
    {
        [JsonPropertyName("id")] public SearchItemId Id { get; set; } = new();
        [JsonPropertyName("snippet")] public SearchSnippet Snippet { get; set; } = new();
    }
}
