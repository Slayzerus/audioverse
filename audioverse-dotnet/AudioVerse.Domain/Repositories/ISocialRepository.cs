using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for universal ratings, tags, comments, and user lists.
/// </summary>
public interface ISocialRepository
{
    // ── Ratings ──

    /// <summary>Upsert a rating (one per player per entity).</summary>
    Task<UserRating> UpsertRatingAsync(UserRating rating);

    /// <summary>Get a player's rating for a specific entity.</summary>
    Task<UserRating?> GetRatingAsync(RateableEntityType entityType, int entityId, int playerId);

    /// <summary>Get all ratings for an entity (with optional paging).</summary>
    Task<(IEnumerable<UserRating> Items, int TotalCount)> GetRatingsAsync(
        RateableEntityType entityType, int entityId, int page, int pageSize);

    /// <summary>Delete (soft) a rating.</summary>
    Task<bool> DeleteRatingAsync(int ratingId, int playerId);

    /// <summary>Get or create rating aggregate for an entity.</summary>
    Task<RatingAggregate> GetRatingAggregateAsync(RateableEntityType entityType, int entityId);

    /// <summary>Recalculate rating aggregate after a change.</summary>
    Task RecalculateAggregateAsync(RateableEntityType entityType, int entityId);

    // ── Tags ──

    /// <summary>Add a tag (idempotent — ignores duplicates).</summary>
    Task<UserTag> AddTagAsync(UserTag tag);

    /// <summary>Remove a tag.</summary>
    Task<bool> RemoveTagAsync(int tagId, int playerId);

    /// <summary>Get all tags for an entity.</summary>
    Task<IEnumerable<UserTag>> GetTagsAsync(RateableEntityType entityType, int entityId);

    /// <summary>Get tag cloud for an entity (tag + count).</summary>
    Task<List<(string Tag, int Count)>> GetTagCloudAsync(RateableEntityType entityType, int entityId);

    /// <summary>Get all tags applied by a player.</summary>
    Task<IEnumerable<UserTag>> GetPlayerTagsAsync(int playerId, RateableEntityType? entityType = null);

    // ── Comments ──

    /// <summary>Add a comment.</summary>
    Task<UserComment> AddCommentAsync(UserComment comment);

    /// <summary>Update a comment's content.</summary>
    Task<bool> UpdateCommentAsync(int commentId, int playerId, string newContent);

    /// <summary>Delete (soft) a comment.</summary>
    Task<bool> DeleteCommentAsync(int commentId, int playerId);

    /// <summary>Get comments for an entity (threaded, paged).</summary>
    Task<(IEnumerable<UserComment> Items, int TotalCount)> GetCommentsAsync(
        RateableEntityType entityType, int entityId, int page, int pageSize);

    /// <summary>Add/toggle a reaction on a comment.</summary>
    Task<bool> ToggleCommentReactionAsync(int commentId, int playerId, string reactionType);

    // ── User Lists ──

    /// <summary>Add an entity to a user list.</summary>
    Task<UserListEntry> AddToListAsync(UserListEntry entry);

    /// <summary>Remove an entity from a user list.</summary>
    Task<bool> RemoveFromListAsync(int entryId, int playerId);

    /// <summary>Get a player's list entries.</summary>
    Task<IEnumerable<UserListEntry>> GetPlayerListAsync(int playerId, string listName, RateableEntityType? entityType = null);

    /// <summary>Check if an entity is in a player's list.</summary>
    Task<bool> IsInListAsync(RateableEntityType entityType, int entityId, int playerId, string listName);
}
