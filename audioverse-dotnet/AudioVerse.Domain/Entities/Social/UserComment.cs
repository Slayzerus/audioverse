using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Social;

/// <summary>
/// Universal user comment on any entity.
/// Supports threading via ParentCommentId and reactions via UserCommentReaction.
/// </summary>
public class UserComment
{
    public int Id { get; set; }

    /// <summary>Type of entity being commented on.</summary>
    public RateableEntityType EntityType { get; set; }

    /// <summary>Primary key of the commented entity.</summary>
    public int EntityId { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Comment text (Markdown-capable).</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Parent comment ID for threading (null = top-level).</summary>
    public int? ParentCommentId { get; set; }
    public UserComment? ParentComment { get; set; }

    /// <summary>Whether this comment contains spoilers.</summary>
    public bool ContainsSpoilers { get; set; }

    /// <summary>Whether the comment has been edited.</summary>
    public bool IsEdited { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<UserComment> Replies { get; set; } = [];
    public List<UserCommentReaction> Reactions { get; set; } = [];
}
