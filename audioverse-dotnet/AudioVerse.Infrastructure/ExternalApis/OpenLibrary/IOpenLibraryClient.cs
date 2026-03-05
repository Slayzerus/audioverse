namespace AudioVerse.Infrastructure.ExternalApis.OpenLibrary;

/// <summary>Client for Open Library API — book search and details.</summary>
public interface IOpenLibraryClient
{
    Task<List<OpenLibrarySearchResult>> SearchAsync(string query, int limit = 20, CancellationToken ct = default);
    Task<OpenLibraryBookDetails?> GetByIsbnAsync(string isbn, CancellationToken ct = default);
    Task<OpenLibraryBookDetails?> GetByOlIdAsync(string olId, CancellationToken ct = default);
}
