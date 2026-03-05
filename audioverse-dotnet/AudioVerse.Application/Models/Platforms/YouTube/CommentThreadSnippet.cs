using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class CommentThreadSnippet
    {
        [JsonPropertyName("videoId")] public string VideoId { get; set; } = string.Empty;
        [JsonPropertyName("topLevelComment")] public Comment TopLevelComment { get; set; } = new();
        [JsonPropertyName("totalReplyCount")] public int TotalReplyCount { get; set; }
    }
}
