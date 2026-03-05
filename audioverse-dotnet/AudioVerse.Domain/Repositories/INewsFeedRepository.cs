using AudioVerse.Domain.Entities.News;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repozytorium do zarządzania feedami RSS i artykułami.
/// </summary>
public interface INewsFeedRepository
{
    Task<IEnumerable<NewsFeedCategory>> GetCategoriesAsync(bool activeOnly = true);
    Task<NewsFeedCategory?> GetCategoryBySlugAsync(string slug);
    Task<NewsFeedCategory?> GetCategoryByIdAsync(int id);
    Task<int> CreateCategoryAsync(NewsFeedCategory category);
    Task<bool> UpdateCategoryAsync(NewsFeedCategory category);

    Task<IEnumerable<NewsFeed>> GetFeedsAsync(bool activeOnly = true);
    Task<IEnumerable<NewsFeed>> GetFeedsDueForRefreshAsync();
    Task<NewsFeed?> GetFeedByIdAsync(int id);
    Task<int> CreateFeedAsync(NewsFeed feed);
    Task<bool> UpdateFeedAsync(NewsFeed feed);
    Task<bool> DeleteFeedAsync(int id);
    Task UpdateFeedStatusAsync(int feedId, DateTime fetchedAt, string? error);

    Task<IEnumerable<NewsArticle>> GetArticlesAsync(int? categoryId = null, int? feedId = null, int page = 1, int pageSize = 20);
    Task<int> GetArticlesCountAsync(int? categoryId = null, int? feedId = null);
    Task<bool> ArticleExistsAsync(int feedId, string externalId);
    Task AddArticlesAsync(IEnumerable<NewsArticle> articles);
    Task<int> CleanupOldArticlesAsync(int keepDays = 90);
}
