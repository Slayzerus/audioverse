

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to post a comment/review.</summary>
public record CommentRequest(string Content, string? DisplayName = null, int? Rating = null);
