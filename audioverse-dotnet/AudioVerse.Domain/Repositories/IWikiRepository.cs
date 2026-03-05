using AudioVerse.Domain.Entities.Admin;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for wiki documentation pages.
/// </summary>
public interface IWikiRepository
{
    Task<IEnumerable<WikiPage>> GetAllAsync(string? category, bool publishedOnly);
    Task<IEnumerable<WikiPage>> GetPublishedForNavAsync();
    Task<WikiPage?> GetBySlugAsync(string slug);
    Task<WikiPage?> GetByIdAsync(int id);
    Task<WikiPage?> GetByIdWithRevisionsAsync(int id);
    Task<bool> SlugExistsAsync(string slug);
    Task<IEnumerable<WikiPage>> SearchAsync(string term, int take);
    Task<IDictionary<string, int>> GetCategoryCountsAsync();

    Task<int> AddAsync(WikiPage page);
    Task UpdateAsync(WikiPage page);
    Task DeleteAsync(WikiPage page);
    Task SaveChangesAsync();

    // Revisions
    Task<IEnumerable<WikiPageRevision>> GetRevisionsAsync(int pageId);
    Task<WikiPageRevision?> GetRevisionAsync(int pageId, int revisionNumber);
    Task<int> GetMaxRevisionNumberAsync(int pageId);
    Task AddRevisionAsync(WikiPageRevision revision);

    // Reorder
    Task<IEnumerable<WikiPage>> GetByIdsAsync(IEnumerable<int> ids);
}
