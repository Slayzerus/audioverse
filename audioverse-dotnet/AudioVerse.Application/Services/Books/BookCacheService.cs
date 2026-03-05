using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis.GoogleBooks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Services.Books;

/// <summary>
/// Cache-through book search via Google Books API.
/// Local DB → Google Books API → upsert → return.
/// No full-sync job (too many books), only on-demand caching.
/// </summary>
public class BookCacheService(
    IServiceScopeFactory scopeFactory,
    ILogger<BookCacheService> logger) : IBookCacheService
{
    public async Task<List<Book>> SearchWithCacheThroughAsync(string query, int limit = 20, CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMediaCatalogRepository>();
        var googleClient = scope.ServiceProvider.GetRequiredService<IGoogleBooksClient>();

        // 1. Search local DB first
        var local = (await repo.SearchBooksAsync(query, limit)).ToList();
        if (local.Count >= limit)
            return local;

        // 2. Not enough results → search Google Books
        try
        {
            var googleResults = await googleClient.SearchAsync(query, Math.Min(limit * 2, 40), ct);
            var newResults = googleResults
                .Where(r => !string.IsNullOrEmpty(r.Id))
                .Where(r => !local.Any(l => l.GoogleBooksId == r.Id))
                .Take(limit - local.Count)
                .ToList();

            if (newResults.Count > 0)
            {
                var newBooks = newResults.Select(MapSearchResultToBook).ToList();
                await repo.UpsertBooksFromGoogleAsync(newBooks);
                logger.LogInformation("Book cache-through: fetched {Count} books from Google for query '{Query}'",
                    newBooks.Count, query);

                // Re-search local DB to get entities with IDs
                local = (await repo.SearchBooksAsync(query, limit)).ToList();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Google Books search failed for '{Query}', returning local results only", query);
        }

        return local;
    }

    public async Task<Book?> GetByGoogleIdWithCacheAsync(string googleBooksId, CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMediaCatalogRepository>();

        // 1. Check local
        var existing = await repo.GetBookByGoogleIdAsync(googleBooksId);
        if (existing != null)
            return existing;

        // 2. Fetch from Google Books
        try
        {
            var googleClient = scope.ServiceProvider.GetRequiredService<IGoogleBooksClient>();
            var details = await googleClient.GetByIdAsync(googleBooksId, ct);
            if (details == null) return null;

            var book = MapDetailsToBook(details);
            await repo.UpsertBooksFromGoogleAsync([book]);
            logger.LogInformation("Book cache-through: fetched details for Google ID '{Id}'", googleBooksId);

            return await repo.GetBookByGoogleIdAsync(googleBooksId);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Google Books details fetch failed for '{Id}'", googleBooksId);
            return null;
        }
    }

    public async Task<List<Book>> ExportCatalogAsync(CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMediaCatalogRepository>();
        return await repo.GetAllGoogleBooksAsync();
    }

    public async Task<int> ImportCatalogAsync(List<Book> books, CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMediaCatalogRepository>();
        var count = await repo.UpsertBooksFromGoogleAsync(books);
        logger.LogInformation("Imported {Count} Google Books from catalog file", count);
        return count;
    }

    private static Book MapSearchResultToBook(GoogleBooksSearchResult r) => new()
    {
        GoogleBooksId = r.Id,
        Title = r.Title,
        Author = r.Authors.Count > 0 ? string.Join(", ", r.Authors) : null,
        Description = r.Description?.Length > 2000 ? r.Description[..2000] : r.Description,
        Isbn = r.Isbn13,
        PageCount = r.PageCount,
        PublishedYear = ParseYear(r.PublishedDate),
        CoverUrl = r.ThumbnailUrl,
        Genre = r.Categories.Count > 0 ? string.Join(", ", r.Categories) : null,
        Language = null,
        ImportedFrom = "GoogleBooks"
    };

    private static Book MapDetailsToBook(GoogleBooksDetails d) => new()
    {
        GoogleBooksId = d.Id,
        Title = d.Title,
        Author = d.Authors.Count > 0 ? string.Join(", ", d.Authors) : null,
        Description = d.Description?.Length > 2000 ? d.Description[..2000] : d.Description,
        Isbn = d.Isbn13,
        PageCount = d.PageCount,
        PublishedYear = ParseYear(d.PublishedDate),
        Publisher = d.Publisher,
        CoverUrl = d.ThumbnailUrl,
        Genre = d.Categories.Count > 0 ? string.Join(", ", d.Categories) : null,
        Rating = d.AverageRating,
        Language = d.Language,
        ImportedFrom = "GoogleBooks"
    };

    private static int? ParseYear(string? date)
    {
        if (string.IsNullOrWhiteSpace(date)) return null;
        // Formats: "2023", "2023-05", "2023-05-15"
        if (date.Length >= 4 && int.TryParse(date[..4], out var year))
            return year;
        return null;
    }
}
