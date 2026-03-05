using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

public class NewsFeedRepositoryEF : INewsFeedRepository
{
    private readonly AudioVerseDbContext _db;
    private readonly ILogger<NewsFeedRepositoryEF> _logger;

    public NewsFeedRepositoryEF(AudioVerseDbContext db, ILogger<NewsFeedRepositoryEF> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<IEnumerable<NewsFeedCategory>> GetCategoriesAsync(bool activeOnly = true)
    {
        var q = _db.NewsFeedCategories.AsQueryable();
        if (activeOnly) q = q.Where(c => c.IsActive);
        return await q.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();
    }

    public async Task<NewsFeedCategory?> GetCategoryBySlugAsync(string slug)
        => await _db.NewsFeedCategories.FirstOrDefaultAsync(c => c.Slug == slug);

    public async Task<NewsFeedCategory?> GetCategoryByIdAsync(int id)
        => await _db.NewsFeedCategories.FindAsync(id);

    public async Task<int> CreateCategoryAsync(NewsFeedCategory category)
    {
        _db.NewsFeedCategories.Add(category);
        await _db.SaveChangesAsync();
        return category.Id;
    }

    public async Task<bool> UpdateCategoryAsync(NewsFeedCategory category)
    {
        _db.NewsFeedCategories.Update(category);
        return await _db.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<NewsFeed>> GetFeedsAsync(bool activeOnly = true)
    {
        var q = _db.NewsFeeds.Include(f => f.Category).AsQueryable();
        if (activeOnly) q = q.Where(f => f.IsActive);
        return await q.OrderBy(f => f.Title).ToListAsync();
    }

    public async Task<IEnumerable<NewsFeed>> GetFeedsDueForRefreshAsync()
    {
        var now = DateTime.UtcNow;
        return await _db.NewsFeeds
            .Where(f => f.IsActive && (f.LastFetchedAt == null || f.LastFetchedAt.Value.AddMinutes(f.RefreshIntervalMinutes) <= now))
            .ToListAsync();
    }

    public async Task<NewsFeed?> GetFeedByIdAsync(int id)
        => await _db.NewsFeeds.Include(f => f.Category).FirstOrDefaultAsync(f => f.Id == id);

    public async Task<int> CreateFeedAsync(NewsFeed feed)
    {
        _db.NewsFeeds.Add(feed);
        await _db.SaveChangesAsync();
        return feed.Id;
    }

    public async Task<bool> UpdateFeedAsync(NewsFeed feed)
    {
        _db.NewsFeeds.Update(feed);
        return await _db.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteFeedAsync(int id)
    {
        var feed = await _db.NewsFeeds.FindAsync(id);
        if (feed == null) return false;
        _db.NewsFeeds.Remove(feed);
        return await _db.SaveChangesAsync() > 0;
    }

    public async Task UpdateFeedStatusAsync(int feedId, DateTime fetchedAt, string? error)
    {
        var feed = await _db.NewsFeeds.FindAsync(feedId);
        if (feed == null) return;
        feed.LastFetchedAt = fetchedAt;
        feed.LastFetchError = error;
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<NewsArticle>> GetArticlesAsync(int? categoryId = null, int? feedId = null, int page = 1, int pageSize = 20)
    {
        var q = _db.NewsArticles.Include(a => a.Feed).ThenInclude(f => f!.Category).AsQueryable();
        if (feedId.HasValue) q = q.Where(a => a.FeedId == feedId.Value);
        else if (categoryId.HasValue) q = q.Where(a => a.Feed!.CategoryId == categoryId.Value);
        return await q.OrderByDescending(a => a.PublishedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public async Task<int> GetArticlesCountAsync(int? categoryId = null, int? feedId = null)
    {
        var q = _db.NewsArticles.AsQueryable();
        if (feedId.HasValue) q = q.Where(a => a.FeedId == feedId.Value);
        else if (categoryId.HasValue) q = q.Where(a => a.Feed!.CategoryId == categoryId.Value);
        return await q.CountAsync();
    }

    public async Task<bool> ArticleExistsAsync(int feedId, string externalId)
        => await _db.NewsArticles.AnyAsync(a => a.FeedId == feedId && a.ExternalId == externalId);

    public async Task AddArticlesAsync(IEnumerable<NewsArticle> articles)
    {
        _db.NewsArticles.AddRange(articles);
        await _db.SaveChangesAsync();
    }

    public async Task<int> CleanupOldArticlesAsync(int keepDays = 90)
    {
        var cutoff = DateTime.UtcNow.AddDays(-keepDays);
        var old = await _db.NewsArticles.Where(a => a.PublishedAt < cutoff).ToListAsync();
        if (old.Count == 0) return 0;
        _db.NewsArticles.RemoveRange(old);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Cleaned up {Count} old news articles", old.Count);
        return old.Count;
    }
}
