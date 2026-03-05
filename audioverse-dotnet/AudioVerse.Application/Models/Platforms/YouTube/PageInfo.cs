using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class PageInfo
    {
        [JsonPropertyName("totalResults")] public int TotalResults { get; set; }
        [JsonPropertyName("resultsPerPage")] public int ResultsPerPage { get; set; }
    }
}
