using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Social;

/// <summary>
/// Reaction (like, love, fire, etc.) on a user comment.
/// One reaction type per player per comment.
/// </summary>
public class UserCommentReaction
{
    public int Id { get; set; }

    public int CommentId { get; set; }
    public UserComment? Comment { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Reaction type (e.g. "like", "love", "fire", "laugh", "sad", "dislike").</summary>
    public string ReactionType { get; set; } = "like";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
