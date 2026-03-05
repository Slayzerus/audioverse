using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>EF Core implementation of IMediaCatalogRepository (Movies, TV Shows, Books, Sports).</summary>
public class MediaCatalogRepositoryEF(AudioVerseDbContext db) : IMediaCatalogRepository
{
    // ── Movies ──

    public async Task<(IEnumerable<Movie> Items, int TotalCount)> GetMoviesPagedAsync(int page, int pageSize, string? query, string? sortBy, bool descending)
    {
        var q = db.Movies.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(m => m.Title.Contains(query) || (m.Director != null && m.Director.Contains(query)));
        var total = await q.CountAsync();
        q = sortBy?.ToLowerInvariant() switch
        {
            "year" => descending ? q.OrderByDescending(m => m.ReleaseYear) : q.OrderBy(m => m.ReleaseYear),
            "rating" => descending ? q.OrderByDescending(m => m.Rating) : q.OrderBy(m => m.Rating),
            _ => descending ? q.OrderByDescending(m => m.Title) : q.OrderBy(m => m.Title)
        };
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<int> AddMovieAsync(Movie movie) { db.Movies.Add(movie); await db.SaveChangesAsync(); return movie.Id; }
    public Task<Movie?> GetMovieByIdAsync(int id) => db.Movies.Include(m => m.Tags).FirstOrDefaultAsync(m => m.Id == id);
    public async Task<IEnumerable<Movie>> SearchMoviesAsync(string query, int limit) =>
        await db.Movies.Where(m => m.Title.Contains(query)).Take(limit).ToListAsync();
    public async Task<bool> UpdateMovieAsync(Movie movie) { db.Movies.Update(movie); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteMovieAsync(int id) { var e = await db.Movies.FindAsync(id); if (e == null) return false; db.Movies.Remove(e); return await db.SaveChangesAsync() > 0; }

    // ── TV Shows ──

    public async Task<(IEnumerable<TvShow> Items, int TotalCount)> GetTvShowsPagedAsync(int page, int pageSize, string? query, string? sortBy, bool descending)
    {
        var q = db.TvShows.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(s => s.Title.Contains(query));
        var total = await q.CountAsync();
        q = sortBy?.ToLowerInvariant() switch
        {
            "year" => descending ? q.OrderByDescending(s => s.FirstAirYear) : q.OrderBy(s => s.FirstAirYear),
            "rating" => descending ? q.OrderByDescending(s => s.Rating) : q.OrderBy(s => s.Rating),
            _ => descending ? q.OrderByDescending(s => s.Title) : q.OrderBy(s => s.Title)
        };
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<int> AddTvShowAsync(TvShow show) { db.TvShows.Add(show); await db.SaveChangesAsync(); return show.Id; }
    public Task<TvShow?> GetTvShowByIdAsync(int id) => db.TvShows.Include(s => s.Tags).FirstOrDefaultAsync(s => s.Id == id);
    public async Task<IEnumerable<TvShow>> SearchTvShowsAsync(string query, int limit) =>
        await db.TvShows.Where(s => s.Title.Contains(query)).Take(limit).ToListAsync();
    public async Task<bool> UpdateTvShowAsync(TvShow show) { db.TvShows.Update(show); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteTvShowAsync(int id) { var e = await db.TvShows.FindAsync(id); if (e == null) return false; db.TvShows.Remove(e); return await db.SaveChangesAsync() > 0; }

    // ── Books ──

    public async Task<(IEnumerable<Book> Items, int TotalCount)> GetBooksPagedAsync(int page, int pageSize, string? query, string? sortBy, bool descending)
    {
        var q = db.Books.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(b => b.Title.Contains(query) || (b.Author != null && b.Author.Contains(query)));
        var total = await q.CountAsync();
        q = sortBy?.ToLowerInvariant() switch
        {
            "year" => descending ? q.OrderByDescending(b => b.PublishedYear) : q.OrderBy(b => b.PublishedYear),
            "author" => descending ? q.OrderByDescending(b => b.Author) : q.OrderBy(b => b.Author),
            _ => descending ? q.OrderByDescending(b => b.Title) : q.OrderBy(b => b.Title)
        };
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<int> AddBookAsync(Book book) { db.Books.Add(book); await db.SaveChangesAsync(); return book.Id; }
    public Task<Book?> GetBookByIdAsync(int id) => db.Books.Include(b => b.Tags).FirstOrDefaultAsync(b => b.Id == id);
    public Task<Book?> GetBookByGoogleIdAsync(string googleBooksId) => db.Books.FirstOrDefaultAsync(b => b.GoogleBooksId == googleBooksId);
    public async Task<IEnumerable<Book>> SearchBooksAsync(string query, int limit) =>
        await db.Books.Where(b => b.Title.Contains(query) || (b.Author != null && b.Author.Contains(query))).Take(limit).ToListAsync();
    public async Task<bool> UpdateBookAsync(Book book) { db.Books.Update(book); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteBookAsync(int id) { var e = await db.Books.FindAsync(id); if (e == null) return false; db.Books.Remove(e); return await db.SaveChangesAsync() > 0; }

    public async Task<int> UpsertBooksFromGoogleAsync(IEnumerable<Book> books)
    {
        int count = 0;
        foreach (var book in books)
        {
            var existing = await db.Books.FirstOrDefaultAsync(b => b.GoogleBooksId == book.GoogleBooksId);
            if (existing != null)
            {
                existing.Title = book.Title;
                existing.Author = book.Author;
                existing.Description = book.Description;
                existing.Isbn = book.Isbn;
                existing.PageCount = book.PageCount;
                existing.PublishedYear = book.PublishedYear;
                existing.Publisher = book.Publisher;
                existing.CoverUrl = book.CoverUrl;
                existing.Genre = book.Genre;
                existing.Rating = book.Rating;
                existing.Language = book.Language;
                existing.GoogleBooksLastSyncUtc = DateTime.UtcNow;
            }
            else
            {
                book.GoogleBooksLastSyncUtc = DateTime.UtcNow;
                book.ImportedFrom = "GoogleBooks";
                db.Books.Add(book);
            }
            count++;
        }
        await db.SaveChangesAsync();
        return count;
    }

    public async Task<List<Book>> GetAllGoogleBooksAsync()
        => await db.Books.Where(b => b.GoogleBooksId != null).OrderBy(b => b.Title).AsNoTracking().ToListAsync();

    // ── Sports ──

    public async Task<(IEnumerable<SportActivity> Items, int TotalCount)> GetSportsPagedAsync(int page, int pageSize, string? query, string? sortBy, bool descending)
    {
        var q = db.SportActivities.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(s => s.Name.Contains(query));
        var total = await q.CountAsync();
        q = sortBy?.ToLowerInvariant() switch
        {
            "category" => descending ? q.OrderByDescending(s => s.Category) : q.OrderBy(s => s.Category),
            _ => descending ? q.OrderByDescending(s => s.Name) : q.OrderBy(s => s.Name)
        };
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<int> AddSportAsync(SportActivity sport) { db.SportActivities.Add(sport); await db.SaveChangesAsync(); return sport.Id; }
    public Task<SportActivity?> GetSportByIdAsync(int id) => db.SportActivities.Include(s => s.Tags).FirstOrDefaultAsync(s => s.Id == id);
    public async Task<IEnumerable<SportActivity>> SearchSportsAsync(string query, int limit) =>
        await db.SportActivities.Where(s => s.Name.Contains(query)).Take(limit).ToListAsync();
    public async Task<bool> UpdateSportAsync(SportActivity sport) { db.SportActivities.Update(sport); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteSportAsync(int id) { var e = await db.SportActivities.FindAsync(id); if (e == null) return false; db.SportActivities.Remove(e); return await db.SaveChangesAsync() > 0; }

    // ── Movie Collections ──

    public async Task<int> AddMovieCollectionAsync(MovieCollection c) { db.MovieCollections.Add(c); await db.SaveChangesAsync(); return c.Id; }
    public Task<MovieCollection?> GetMovieCollectionByIdAsync(int id, bool includeChildren, int maxDepth) =>
        includeChildren ? db.MovieCollections.Include(c => c.Children).Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id)
                        : db.MovieCollections.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
    public async Task<IEnumerable<MovieCollection>> GetMovieCollectionsByOwnerAsync(int ownerId) =>
        await db.MovieCollections.Where(c => c.OwnerId == ownerId).ToListAsync();
    public async Task<bool> UpdateMovieCollectionAsync(MovieCollection c) { db.MovieCollections.Update(c); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteMovieCollectionAsync(int id) { var e = await db.MovieCollections.FindAsync(id); if (e == null) return false; db.MovieCollections.Remove(e); return await db.SaveChangesAsync() > 0; }
    public async Task<int> AddMovieToCollectionAsync(MovieCollectionMovie item) { db.Set<MovieCollectionMovie>().Add(item); await db.SaveChangesAsync(); return item.Id; }
    public async Task<bool> RemoveMovieFromCollectionAsync(int id) { var e = await db.Set<MovieCollectionMovie>().FindAsync(id); if (e == null) return false; db.Set<MovieCollectionMovie>().Remove(e); return await db.SaveChangesAsync() > 0; }

    // ── TvShow Collections ──

    public async Task<int> AddTvShowCollectionAsync(TvShowCollection c) { db.TvShowCollections.Add(c); await db.SaveChangesAsync(); return c.Id; }
    public Task<TvShowCollection?> GetTvShowCollectionByIdAsync(int id, bool includeChildren, int maxDepth) =>
        includeChildren ? db.TvShowCollections.Include(c => c.Children).Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id)
                        : db.TvShowCollections.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
    public async Task<IEnumerable<TvShowCollection>> GetTvShowCollectionsByOwnerAsync(int ownerId) =>
        await db.TvShowCollections.Where(c => c.OwnerId == ownerId).ToListAsync();
    public async Task<bool> UpdateTvShowCollectionAsync(TvShowCollection c) { db.TvShowCollections.Update(c); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteTvShowCollectionAsync(int id) { var e = await db.TvShowCollections.FindAsync(id); if (e == null) return false; db.TvShowCollections.Remove(e); return await db.SaveChangesAsync() > 0; }
    public async Task<int> AddTvShowToCollectionAsync(TvShowCollectionTvShow item) { db.Set<TvShowCollectionTvShow>().Add(item); await db.SaveChangesAsync(); return item.Id; }
    public async Task<bool> RemoveTvShowFromCollectionAsync(int id) { var e = await db.Set<TvShowCollectionTvShow>().FindAsync(id); if (e == null) return false; db.Set<TvShowCollectionTvShow>().Remove(e); return await db.SaveChangesAsync() > 0; }

    // ── Book Collections ──

    public async Task<int> AddBookCollectionAsync(BookCollection c) { db.BookCollections.Add(c); await db.SaveChangesAsync(); return c.Id; }
    public Task<BookCollection?> GetBookCollectionByIdAsync(int id, bool includeChildren, int maxDepth) =>
        includeChildren ? db.BookCollections.Include(c => c.Children).Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id)
                        : db.BookCollections.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id);
    public async Task<IEnumerable<BookCollection>> GetBookCollectionsByOwnerAsync(int ownerId) =>
        await db.BookCollections.Where(c => c.OwnerId == ownerId).ToListAsync();
    public async Task<bool> UpdateBookCollectionAsync(BookCollection c) { db.BookCollections.Update(c); return await db.SaveChangesAsync() > 0; }
    public async Task<bool> DeleteBookCollectionAsync(int id) { var e = await db.BookCollections.FindAsync(id); if (e == null) return false; db.BookCollections.Remove(e); return await db.SaveChangesAsync() > 0; }
    public async Task<int> AddBookToCollectionAsync(BookCollectionBook item) { db.Set<BookCollectionBook>().Add(item); await db.SaveChangesAsync(); return item.Id; }
    public async Task<bool> RemoveBookFromCollectionAsync(int id) { var e = await db.Set<BookCollectionBook>().FindAsync(id); if (e == null) return false; db.Set<BookCollectionBook>().Remove(e); return await db.SaveChangesAsync() > 0; }
}
