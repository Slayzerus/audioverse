using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of ISocialRepository.
/// Handles universal ratings, tags, comments, and user lists.
/// </summary>
public class SocialRepositoryEF(AudioVerseDbContext db) : ISocialRepository
{
    // ── Ratings ──

    public async Task<UserRating> UpsertRatingAsync(UserRating rating)
    {
        var existing = await db.UserRatings.FirstOrDefaultAsync(r =>
            r.EntityType == rating.EntityType && r.EntityId == rating.EntityId
            && r.PlayerId == rating.PlayerId && !r.IsDeleted);

        if (existing != null)
        {
            existing.OverallScore = rating.OverallScore;
            existing.Criterion1 = rating.Criterion1;
            existing.Criterion1Score = rating.Criterion1Score;
            existing.Criterion2 = rating.Criterion2;
            existing.Criterion2Score = rating.Criterion2Score;
            existing.Criterion3 = rating.Criterion3;
            existing.Criterion3Score = rating.Criterion3Score;
            existing.ReviewText = rating.ReviewText;
            existing.ContainsSpoilers = rating.ContainsSpoilers;
            existing.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync();
            await RecalculateAggregateAsync(rating.EntityType, rating.EntityId);
            return existing;
        }

        db.UserRatings.Add(rating);
        await db.SaveChangesAsync();
        await RecalculateAggregateAsync(rating.EntityType, rating.EntityId);
        return rating;
    }

    public async Task<UserRating?> GetRatingAsync(RateableEntityType entityType, int entityId, int playerId)
    {
        return await db.UserRatings.FirstOrDefaultAsync(r =>
            r.EntityType == entityType && r.EntityId == entityId
            && r.PlayerId == playerId && !r.IsDeleted);
    }

    public async Task<(IEnumerable<UserRating> Items, int TotalCount)> GetRatingsAsync(
        RateableEntityType entityType, int entityId, int page, int pageSize)
    {
        var query = db.UserRatings
            .Include(r => r.Player)
            .Where(r => r.EntityType == entityType && r.EntityId == entityId && !r.IsDeleted);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<bool> DeleteRatingAsync(int ratingId, int playerId)
    {
        var rating = await db.UserRatings.FirstOrDefaultAsync(r => r.Id == ratingId && r.PlayerId == playerId);
        if (rating == null) return false;
        rating.IsDeleted = true;
        await db.SaveChangesAsync();
        await RecalculateAggregateAsync(rating.EntityType, rating.EntityId);
        return true;
    }

    public async Task<RatingAggregate> GetRatingAggregateAsync(RateableEntityType entityType, int entityId)
    {
        var agg = await db.RatingAggregates.FirstOrDefaultAsync(a =>
            a.EntityType == entityType && a.EntityId == entityId);

        if (agg != null) return agg;

        agg = new RatingAggregate { EntityType = entityType, EntityId = entityId };
        db.RatingAggregates.Add(agg);
        await db.SaveChangesAsync();
        return agg;
    }

    public async Task RecalculateAggregateAsync(RateableEntityType entityType, int entityId)
    {
        var ratings = await db.UserRatings
            .Where(r => r.EntityType == entityType && r.EntityId == entityId && !r.IsDeleted)
            .ToListAsync();

        var agg = await db.RatingAggregates.FirstOrDefaultAsync(a =>
            a.EntityType == entityType && a.EntityId == entityId);

        if (agg == null)
        {
            agg = new RatingAggregate { EntityType = entityType, EntityId = entityId };
            db.RatingAggregates.Add(agg);
        }

        agg.RatingCount = ratings.Count;
        agg.AverageOverall = ratings.Count > 0 ? ratings.Average(r => r.OverallScore) : 0;
        agg.AverageCriterion1 = ratings.Where(r => r.Criterion1Score.HasValue).Select(r => (double)r.Criterion1Score!.Value).DefaultIfEmpty().Average();
        agg.AverageCriterion2 = ratings.Where(r => r.Criterion2Score.HasValue).Select(r => (double)r.Criterion2Score!.Value).DefaultIfEmpty().Average();
        agg.AverageCriterion3 = ratings.Where(r => r.Criterion3Score.HasValue).Select(r => (double)r.Criterion3Score!.Value).DefaultIfEmpty().Average();
        agg.ReviewCount = ratings.Count(r => !string.IsNullOrEmpty(r.ReviewText));
        agg.LastUpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    // ── Tags ──

    public async Task<UserTag> AddTagAsync(UserTag tag)
    {
        tag.Tag = tag.Tag.Trim().ToLowerInvariant();

        var exists = await db.UserTags.AnyAsync(t =>
            t.EntityType == tag.EntityType && t.EntityId == tag.EntityId
            && t.PlayerId == tag.PlayerId && t.Tag == tag.Tag);

        if (exists) return tag;

        db.UserTags.Add(tag);
        await db.SaveChangesAsync();
        return tag;
    }

    public async Task<bool> RemoveTagAsync(int tagId, int playerId)
    {
        var tag = await db.UserTags.FirstOrDefaultAsync(t => t.Id == tagId && t.PlayerId == playerId);
        if (tag == null) return false;
        db.UserTags.Remove(tag);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<UserTag>> GetTagsAsync(RateableEntityType entityType, int entityId)
    {
        return await db.UserTags
            .Include(t => t.Player)
            .Where(t => t.EntityType == entityType && t.EntityId == entityId)
            .OrderBy(t => t.Tag)
            .ToListAsync();
    }

    public async Task<List<(string Tag, int Count)>> GetTagCloudAsync(RateableEntityType entityType, int entityId)
    {
        var raw = await db.UserTags
            .Where(t => t.EntityType == entityType && t.EntityId == entityId)
            .GroupBy(t => t.Tag)
            .Select(g => new { Tag = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return raw.Select(r => (r.Tag, r.Count)).ToList();
    }

    public async Task<IEnumerable<UserTag>> GetPlayerTagsAsync(int playerId, RateableEntityType? entityType = null)
    {
        var query = db.UserTags.Where(t => t.PlayerId == playerId);
        if (entityType.HasValue)
            query = query.Where(t => t.EntityType == entityType.Value);

        return await query.OrderBy(t => t.EntityType).ThenBy(t => t.Tag).ToListAsync();
    }

    // ── Comments ──

    public async Task<UserComment> AddCommentAsync(UserComment comment)
    {
        db.UserComments.Add(comment);
        await db.SaveChangesAsync();
        return comment;
    }

    public async Task<bool> UpdateCommentAsync(int commentId, int playerId, string newContent)
    {
        var comment = await db.UserComments.FirstOrDefaultAsync(c => c.Id == commentId && c.PlayerId == playerId && !c.IsDeleted);
        if (comment == null) return false;
        comment.Content = newContent;
        comment.IsEdited = true;
        comment.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCommentAsync(int commentId, int playerId)
    {
        var comment = await db.UserComments.FirstOrDefaultAsync(c => c.Id == commentId && c.PlayerId == playerId);
        if (comment == null) return false;
        comment.IsDeleted = true;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<(IEnumerable<UserComment> Items, int TotalCount)> GetCommentsAsync(
        RateableEntityType entityType, int entityId, int page, int pageSize)
    {
        var query = db.UserComments
            .Include(c => c.Player)
            .Include(c => c.Reactions)
            .Include(c => c.Replies.Where(r => !r.IsDeleted))
                .ThenInclude(r => r.Player)
            .Where(c => c.EntityType == entityType && c.EntityId == entityId
                && c.ParentCommentId == null && !c.IsDeleted);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<bool> ToggleCommentReactionAsync(int commentId, int playerId, string reactionType)
    {
        var existing = await db.UserCommentReactions.FirstOrDefaultAsync(r =>
            r.CommentId == commentId && r.PlayerId == playerId && r.ReactionType == reactionType);

        if (existing != null)
        {
            db.UserCommentReactions.Remove(existing);
            await db.SaveChangesAsync();
            return false;
        }

        db.UserCommentReactions.Add(new UserCommentReaction
        {
            CommentId = commentId,
            PlayerId = playerId,
            ReactionType = reactionType
        });
        await db.SaveChangesAsync();
        return true;
    }

    // ── User Lists ──

    public async Task<UserListEntry> AddToListAsync(UserListEntry entry)
    {
        var exists = await db.UserListEntries.AnyAsync(e =>
            e.EntityType == entry.EntityType && e.EntityId == entry.EntityId
            && e.PlayerId == entry.PlayerId && e.ListName == entry.ListName);

        if (exists) return entry;

        db.UserListEntries.Add(entry);
        await db.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> RemoveFromListAsync(int entryId, int playerId)
    {
        var entry = await db.UserListEntries.FirstOrDefaultAsync(e => e.Id == entryId && e.PlayerId == playerId);
        if (entry == null) return false;
        db.UserListEntries.Remove(entry);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<UserListEntry>> GetPlayerListAsync(int playerId, string listName, RateableEntityType? entityType = null)
    {
        var query = db.UserListEntries.Where(e => e.PlayerId == playerId && e.ListName == listName);
        if (entityType.HasValue)
            query = query.Where(e => e.EntityType == entityType.Value);

        return await query.OrderBy(e => e.SortOrder).ThenByDescending(e => e.CreatedAtUtc).ToListAsync();
    }

    public async Task<bool> IsInListAsync(RateableEntityType entityType, int entityId, int playerId, string listName)
    {
        return await db.UserListEntries.AnyAsync(e =>
            e.EntityType == entityType && e.EntityId == entityId
            && e.PlayerId == playerId && e.ListName == listName);
    }
}
