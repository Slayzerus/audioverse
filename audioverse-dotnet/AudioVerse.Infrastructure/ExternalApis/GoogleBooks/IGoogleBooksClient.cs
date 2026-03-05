namespace AudioVerse.Infrastructure.ExternalApis.GoogleBooks;

/// <summary>Client for Google Books API v1 — book search and details.</summary>
public interface IGoogleBooksClient
{
    Task<List<GoogleBooksSearchResult>> SearchAsync(string query, int limit = 20, CancellationToken ct = default);
    Task<GoogleBooksDetails?> GetByIdAsync(string volumeId, CancellationToken ct = default);
}
