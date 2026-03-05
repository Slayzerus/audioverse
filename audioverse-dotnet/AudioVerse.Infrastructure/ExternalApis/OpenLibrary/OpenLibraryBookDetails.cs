namespace AudioVerse.Infrastructure.ExternalApis.OpenLibrary;

/// <summary>Full book details from Open Library.</summary>
public class OpenLibraryBookDetails
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string? Description { get; set; }
    public int? NumberOfPages { get; set; }
    public int? PublishYear { get; set; }
    public string? Publisher { get; set; }
    public string? Isbn13 { get; set; }
    public string? CoverUrl { get; set; }
    public List<string> Subjects { get; set; } = new();
}
