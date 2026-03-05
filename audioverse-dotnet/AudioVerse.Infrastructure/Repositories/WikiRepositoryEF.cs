using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

public class WikiRepositoryEF : IWikiRepository
{
    private readonly AudioVerseDbContext _db;
    public WikiRepositoryEF(AudioVerseDbContext db) => _db = db;

    public async Task<IEnumerable<WikiPage>> GetAllAsync(string? category, bool publishedOnly)
    {
        var query = _db.WikiPages.AsQueryable();
        if (publishedOnly) query = query.Where(w => w.IsPublished);
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(w => w.Category == category);
        return await query.OrderBy(w => w.Category).ThenBy(w => w.SortOrder).ThenBy(w => w.Title).ToListAsync();
    }

    public async Task<IEnumerable<WikiPage>> GetPublishedForNavAsync()
        => await _db.WikiPages.Where(w => w.IsPublished).OrderBy(w => w.SortOrder).ThenBy(w => w.Title).ToListAsync();

    public async Task<WikiPage?> GetBySlugAsync(string slug)
        => await _db.WikiPages
            .Include(w => w.Children.Where(c => c.IsPublished).OrderBy(c => c.SortOrder))
            .FirstOrDefaultAsync(w => w.Slug == slug);

    public async Task<WikiPage?> GetByIdAsync(int id) => await _db.WikiPages.FindAsync(id);

    public async Task<WikiPage?> GetByIdWithRevisionsAsync(int id)
        => await _db.WikiPages.Include(w => w.Revisions).FirstOrDefaultAsync(w => w.Id == id);

    public async Task<bool> SlugExistsAsync(string slug)
        => await _db.WikiPages.AnyAsync(w => w.Slug == slug);

    public async Task<IEnumerable<WikiPage>> SearchAsync(string term, int take)
    {
        var t = term.ToLower();
        return await _db.WikiPages
            .Where(w => w.IsPublished)
            .Where(w => w.Title.ToLower().Contains(t)
                || w.ContentMarkdown.ToLower().Contains(t)
                || (w.Tags != null && w.Tags.ToLower().Contains(t)))
            .OrderBy(w => w.Title)
            .Take(take)
            .ToListAsync();
    }

    public async Task<IDictionary<string, int>> GetCategoryCountsAsync()
        => await _db.WikiPages
            .Where(w => w.IsPublished)
            .GroupBy(w => w.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count);

    public async Task<int> AddAsync(WikiPage page)
    {
        _db.WikiPages.Add(page);
        await _db.SaveChangesAsync();
        return page.Id;
    }

    public async Task UpdateAsync(WikiPage page)
    {
        page.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(WikiPage page)
    {
        _db.WikiPageRevisions.RemoveRange(page.Revisions);
        _db.WikiPages.Remove(page);
        await _db.SaveChangesAsync();
    }

    public async Task SaveChangesAsync() => await _db.SaveChangesAsync();

    public async Task<IEnumerable<WikiPageRevision>> GetRevisionsAsync(int pageId)
        => await _db.WikiPageRevisions
            .Where(r => r.WikiPageId == pageId)
            .OrderByDescending(r => r.RevisionNumber)
            .ToListAsync();

    public async Task<WikiPageRevision?> GetRevisionAsync(int pageId, int revisionNumber)
        => await _db.WikiPageRevisions.FirstOrDefaultAsync(r => r.WikiPageId == pageId && r.RevisionNumber == revisionNumber);

    public async Task<int> GetMaxRevisionNumberAsync(int pageId)
        => await _db.WikiPageRevisions.Where(r => r.WikiPageId == pageId).MaxAsync(r => (int?)r.RevisionNumber) ?? 0;

    public async Task AddRevisionAsync(WikiPageRevision revision)
    {
        _db.WikiPageRevisions.Add(revision);
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<WikiPage>> GetByIdsAsync(IEnumerable<int> ids)
        => await _db.WikiPages.Where(p => ids.Contains(p.Id)).ToListAsync();
}
