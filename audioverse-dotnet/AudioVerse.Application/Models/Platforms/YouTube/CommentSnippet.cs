using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class CommentSnippet
    {
        [JsonPropertyName("textDisplay")] public string TextDisplay { get; set; } = string.Empty;
        [JsonPropertyName("authorDisplayName")] public string AuthorDisplayName { get; set; } = string.Empty;
        [JsonPropertyName("likeCount")] public int LikeCount { get; set; }
        [JsonPropertyName("publishedAt")] public DateTimeOffset? PublishedAt { get; set; }
    }
}
