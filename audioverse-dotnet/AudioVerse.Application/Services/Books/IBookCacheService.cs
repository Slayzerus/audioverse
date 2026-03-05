using AudioVerse.Domain.Entities.Media;

namespace AudioVerse.Application.Services.Books;

/// <summary>
/// Cache-through book search and catalog management via Google Books API.
/// Searches local DB first; fetches from Google Books if not enough results,
/// saves them locally, and returns combined results.
/// </summary>
public interface IBookCacheService
{
    /// <summary>Search local DB first, then Google Books if needed (cache-through).</summary>
    Task<List<Book>> SearchWithCacheThroughAsync(string query, int limit = 20, CancellationToken ct = default);

    /// <summary>Get book by ID — local DB first, then Google Books if GoogleBooksId provided.</summary>
    Task<Book?> GetByGoogleIdWithCacheAsync(string googleBooksId, CancellationToken ct = default);

    /// <summary>Export all Google Books-sourced books from local DB as JSON.</summary>
    Task<List<Book>> ExportCatalogAsync(CancellationToken ct = default);

    /// <summary>Import books from JSON into local DB (upsert by GoogleBooksId).</summary>
    Task<int> ImportCatalogAsync(List<Book> books, CancellationToken ct = default);
}
