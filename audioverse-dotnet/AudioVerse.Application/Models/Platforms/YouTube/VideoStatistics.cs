using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class VideoStatistics
    {
        [JsonPropertyName("viewCount")] public string? ViewCount { get; set; }
        [JsonPropertyName("likeCount")] public string? LikeCount { get; set; }
        [JsonPropertyName("favoriteCount")] public string? FavoriteCount { get; set; }
        [JsonPropertyName("commentCount")] public string? CommentCount { get; set; }
    }
}
