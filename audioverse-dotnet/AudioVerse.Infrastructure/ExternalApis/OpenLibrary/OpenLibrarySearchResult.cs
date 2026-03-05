namespace AudioVerse.Infrastructure.ExternalApis.OpenLibrary;

/// <summary>Search result from Open Library.</summary>
public class OpenLibrarySearchResult
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public int? FirstPublishYear { get; set; }
    public string? CoverId { get; set; }
    public List<string> Isbn { get; set; } = new();
}
