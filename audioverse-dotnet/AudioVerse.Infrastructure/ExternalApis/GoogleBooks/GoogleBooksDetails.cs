namespace AudioVerse.Infrastructure.ExternalApis.GoogleBooks;

/// <summary>Full volume details from Google Books API.</summary>
public class GoogleBooksDetails
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public List<string> Authors { get; set; } = new();
    public string? Publisher { get; set; }
    public string? PublishedDate { get; set; }
    public string? Description { get; set; }
    public int? PageCount { get; set; }
    public List<string> Categories { get; set; } = new();
    public string? ThumbnailUrl { get; set; }
    public string? Language { get; set; }
    public string? Isbn13 { get; set; }
    public double? AverageRating { get; set; }
}
