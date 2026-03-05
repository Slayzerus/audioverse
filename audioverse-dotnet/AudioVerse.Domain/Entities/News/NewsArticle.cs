namespace AudioVerse.Domain.Entities.News;

/// <summary>
/// Pojedynczy artykuł/wpis pobrany z feeda RSS.
/// </summary>
public class NewsArticle
{
    public int Id { get; set; }
    public int FeedId { get; set; }
    public NewsFeed? Feed { get; set; }

    /// <summary>
    /// Unikalny identyfikator wpisu w feedzie (guid/link) — do deduplikacji.
    /// </summary>
    public string ExternalId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? ContentHtml { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Author { get; set; }

    public DateTime PublishedAt { get; set; }
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
}
