namespace AudioVerse.API.Models.Requests.MediaCatalog;

/// <summary>DTO for importing Google Books catalog entries.</summary>
public class BookImportItem
{
    public string GoogleBooksId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string? Description { get; set; }
    public string? Isbn { get; set; }
    public int? PageCount { get; set; }
    public int? PublishedYear { get; set; }
    public string? Publisher { get; set; }
    public string? CoverUrl { get; set; }
    public string? Genre { get; set; }
    public double? Rating { get; set; }
    public string? Language { get; set; }
    public DateTime? GoogleBooksLastSyncUtc { get; set; }
}
