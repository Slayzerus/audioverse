using AudioVerse.API.Models.Requests.MediaCatalog;
using AudioVerse.Application.Services.Books;
using AudioVerse.Domain.Entities.Media;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaCatalog.Controllers;

/// <summary>
/// Google Books catalog integration — cache-through search, details, export/import.
/// Every search and detail fetch is cached locally to minimize Google API usage.
/// </summary>
[ApiController]
[Route("api/books")]
[Produces("application/json")]
[Tags("MediaCatalog - Books")]
public class BookCatalogController(IBookCacheService bookCache) : ControllerBase
{
    /// <summary>Search books — local DB first, then Google Books if needed (cache-through).</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required");
        limit = Math.Clamp(limit, 1, 100);
        var results = await bookCache.SearchWithCacheThroughAsync(q, limit);
        return Ok(results.Select(b => new
        {
            b.Id, b.Title, b.Author, b.Description, b.Isbn,
            b.PageCount, b.PublishedYear, b.Publisher,
            b.CoverUrl, b.Genre, b.Rating, b.Language,
            b.GoogleBooksId, b.OpenLibraryId
        }));
    }

    /// <summary>Get book details by Google Books volume ID (cache-through — fetches from Google if not in local DB).</summary>
    [HttpGet("google/{googleBooksId}")]
    public async Task<IActionResult> GetByGoogleId(string googleBooksId)
    {
        var book = await bookCache.GetByGoogleIdWithCacheAsync(googleBooksId);
        if (book == null) return NotFound();
        return Ok(new
        {
            book.Id, book.Title, book.Author, book.Description, book.Isbn,
            book.PageCount, book.PublishedYear, book.Publisher,
            book.CoverUrl, book.Genre, book.Rating, book.Language,
            book.GoogleBooksId, book.OpenLibraryId, book.GoogleBooksLastSyncUtc
        });
    }

    /// <summary>Export the local Google Books catalog as JSON (for backup/transfer).</summary>
    [HttpGet("export")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportCatalog()
    {
        var books = await bookCache.ExportCatalogAsync();
        return Ok(books.Select(b => new
        {
            b.GoogleBooksId, b.Title, b.Author, b.Description, b.Isbn,
            b.PageCount, b.PublishedYear, b.Publisher,
            b.CoverUrl, b.Genre, b.Rating, b.Language,
            b.GoogleBooksLastSyncUtc
        }));
    }

    /// <summary>Import books from JSON (upsert by GoogleBooksId — no re-fetch from Google needed).</summary>
    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    [Consumes("application/json")]
    public async Task<IActionResult> ImportCatalog([FromBody] List<BookImportItem> items)
    {
        if (items == null || items.Count == 0) return BadRequest("No books to import");

        var books = items.Select(i => new Book
        {
            GoogleBooksId = i.GoogleBooksId,
            Title = i.Title,
            Author = i.Author,
            Description = i.Description,
            Isbn = i.Isbn,
            PageCount = i.PageCount,
            PublishedYear = i.PublishedYear,
            Publisher = i.Publisher,
            CoverUrl = i.CoverUrl,
            Genre = i.Genre,
            Rating = i.Rating,
            Language = i.Language,
            GoogleBooksLastSyncUtc = i.GoogleBooksLastSyncUtc ?? DateTime.UtcNow,
            ImportedFrom = "GoogleBooks"
        }).ToList();

        var count = await bookCache.ImportCatalogAsync(books);
        return Ok(new { imported = count });
    }
}
