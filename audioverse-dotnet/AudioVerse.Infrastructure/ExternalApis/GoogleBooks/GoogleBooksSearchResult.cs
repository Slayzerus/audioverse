namespace AudioVerse.Infrastructure.ExternalApis.GoogleBooks;

/// <summary>Search result from Google Books API.</summary>
public class GoogleBooksSearchResult
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? PublishedDate { get; set; }
    public int? PageCount { get; set; }
    public List<string> Categories { get; set; } = new();
    public string? Isbn13 { get; set; }
}
