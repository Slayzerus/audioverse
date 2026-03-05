namespace AudioVerse.Application.Models.Requests.Social;

/// <summary>Request to add a comment to any entity.</summary>
public record AddCommentRequest(
    string EntityType,
    int EntityId,
    int PlayerId,
    string Content,
    int? ParentCommentId = null,
    bool ContainsSpoilers = false
);
