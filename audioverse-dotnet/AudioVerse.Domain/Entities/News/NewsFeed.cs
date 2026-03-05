namespace AudioVerse.Domain.Entities.News;

/// <summary>
/// Źródło RSS/Atom skonfigurowane przez admina.
/// </summary>
public class NewsFeed
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FeedUrl { get; set; } = string.Empty;
    public string? SiteUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string? Language { get; set; }

    public int CategoryId { get; set; }
    public NewsFeedCategory? Category { get; set; }

    public bool IsActive { get; set; } = true;
    public int RefreshIntervalMinutes { get; set; } = 15;
    public DateTime? LastFetchedAt { get; set; }
    public string? LastFetchError { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<NewsArticle> Articles { get; set; } = new List<NewsArticle>();
}
