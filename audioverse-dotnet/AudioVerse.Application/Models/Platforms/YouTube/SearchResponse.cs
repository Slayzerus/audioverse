using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class SearchResponse<TItem>
    {
        [JsonPropertyName("nextPageToken")] public string? NextPageToken { get; set; }
        [JsonPropertyName("prevPageToken")] public string? PrevPageToken { get; set; }
        [JsonPropertyName("pageInfo")] public PageInfo PageInfo { get; set; } = new();
        [JsonPropertyName("items")] public List<TItem> Items { get; set; } = new();
    }
}
