using AudioVerse.API.Models.Requests.Admin;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace AudioVerse.API.Areas.Admin.Controllers;

/// <summary>
/// Wiki documentation pages — CRUD for admins, read for all users.
/// Supports tree navigation, revision history, search and bulk import.
/// </summary>
[ApiController]
[Route("api/wiki")]
[Produces("application/json")]
[Tags("Wiki")]
public class WikiController : ControllerBase
{
    private readonly IWikiRepository _repo;

    public WikiController(IWikiRepository repo)
    {
        _repo = repo;
    }

    // ═══════════════════════════════════════════════════
    //  READ (publiczny)
    // ═══════════════════════════════════════════════════

    /// <summary>
    /// Get all published wiki pages (flat list, optionally filtered by category).
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<WikiPageListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? category = null)
    {
        var publishedOnly = !User.Identity?.IsAuthenticated == true || !User.IsInRole("Admin");
        var pages = await _repo.GetAllAsync(category, publishedOnly);

        return Ok(pages.Select(w => new WikiPageListDto
        {
            Id = w.Id, Slug = w.Slug, Title = w.Title, Category = w.Category,
            SortOrder = w.SortOrder, ParentId = w.ParentId, IsPublished = w.IsPublished,
            Tags = w.Tags, Icon = w.Icon, UpdatedAt = w.UpdatedAt
        }));
    }

    /// <summary>
    /// Get navigation tree grouped by category. Each category contains a tree of pages.
    /// </summary>
    [HttpGet("nav")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<WikiNavCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNavTree()
    {
        var pages = await _repo.GetPublishedForNavAsync();

        var tree = pages
            .GroupBy(p => p.Category)
            .OrderBy(g => g.Min(p => p.SortOrder))
            .Select(g => new WikiNavCategoryDto
            {
                Category = g.Key,
                Pages = BuildTree(g.Select(p => new WikiNavItemDto
                {
                    Id = p.Id, Slug = p.Slug, Title = p.Title,
                    ParentId = p.ParentId, Icon = p.Icon, SortOrder = p.SortOrder
                }).ToList(), null)
            })
            .ToList();

        return Ok(tree);
    }

    /// <summary>
    /// Get wiki page by slug with optional children list and breadcrumbs.
    /// </summary>
    [HttpGet("{*slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(WikiPageFullDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var page = await _repo.GetBySlugAsync(slug);
        if (page == null) return NotFound();
        if (!page.IsPublished && !User.IsInRole("Admin")) return NotFound();

        var breadcrumbs = await BuildBreadcrumbs(page);

        var dto = MapToDto(page);
        dto.Breadcrumbs = breadcrumbs;
        dto.Children = page.Children.Select(c => new WikiNavItemDto
        {
            Id = c.Id, Slug = c.Slug, Title = c.Title,
            ParentId = c.ParentId, Icon = c.Icon, SortOrder = c.SortOrder
        }).ToList();

        return Ok(dto);
    }

    /// <summary>
    /// Search wiki pages by text query.
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<WikiSearchResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(Array.Empty<WikiSearchResultDto>());

        var pages = await _repo.SearchAsync(q, 20);
        return Ok(pages.Select(w => new WikiSearchResultDto
        {
            Id = w.Id, Slug = w.Slug, Title = w.Title,
            Category = w.Category, Tags = w.Tags,
            Snippet = w.ContentMarkdown.Substring(0, Math.Min(200, w.ContentMarkdown.Length))
        }));
    }

    /// <summary>
    /// Get list of all wiki categories with page counts.
    /// </summary>
    [HttpGet("categories")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<WikiCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories()
    {
        var counts = await _repo.GetCategoryCountsAsync();
        return Ok(counts.OrderBy(c => c.Key).Select(c => new WikiCategoryDto { Category = c.Key, PageCount = c.Value }));
    }

    // ═══════════════════════════════════════════════════
    //  REVISIONS (publiczny odczyt, admin zapis)
    // ═══════════════════════════════════════════════════

    /// <summary>
    /// Get revision history for a page.
    /// </summary>
    [HttpGet("{id:int}/revisions")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<WikiRevisionListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevisions(int id)
    {
        var revisions = await _repo.GetRevisionsAsync(id);
        return Ok(revisions.Select(r => new WikiRevisionListDto
        {
            Id = r.Id, RevisionNumber = r.RevisionNumber,
            EditSummary = r.EditSummary, EditedByUserId = r.EditedByUserId, CreatedAt = r.CreatedAt
        }));
    }

    /// <summary>
    /// Get a specific revision content.
    /// </summary>
    [HttpGet("{id:int}/revisions/{revisionNumber:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(WikiRevisionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRevision(int id, int revisionNumber)
    {
        var revision = await _repo.GetRevisionAsync(id, revisionNumber);
        if (revision == null) return NotFound();

        return Ok(new WikiRevisionDto
        {
            Id = revision.Id, WikiPageId = revision.WikiPageId,
            RevisionNumber = revision.RevisionNumber, Title = revision.Title,
            ContentMarkdown = revision.ContentMarkdown, EditSummary = revision.EditSummary,
            EditedByUserId = revision.EditedByUserId, CreatedAt = revision.CreatedAt
        });
    }

    /// <summary>
    /// Revert page to a specific revision. Admin only.
    /// </summary>
    [HttpPost("{id:int}/revisions/{revisionNumber:int}/revert")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(WikiPageFullDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevertToRevision(int id, int revisionNumber)
    {
        var page = await _repo.GetByIdAsync(id);
        if (page == null) return NotFound();

        var revision = await _repo.GetRevisionAsync(id, revisionNumber);
        if (revision == null) return NotFound();

        var userId = int.TryParse(User.FindFirst("id")?.Value, out var uid) ? uid : (int?)null;
        await SaveRevision(page, userId, $"Revert to revision {revisionNumber}");

        page.Title = revision.Title;
        page.ContentMarkdown = revision.ContentMarkdown;
        page.LastEditedByUserId = userId;
        await _repo.UpdateAsync(page);

        return Ok(new { Success = true, RevertedTo = revisionNumber });
    }

    // ═══════════════════════════════════════════════════
    //  WRITE (admin only)
    // ═══════════════════════════════════════════════════

    /// <summary>
    /// Create a new wiki page. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(WikiPageFullDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] WikiPageCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Slug) || string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { Message = "Slug and Title are required" });

        if (await _repo.SlugExistsAsync(request.Slug))
            return BadRequest(new { Message = $"Slug '{request.Slug}' already exists" });

        var userId = int.TryParse(User.FindFirst("id")?.Value, out var id) ? id : (int?)null;

        var page = new WikiPage
        {
            Slug = request.Slug.Trim().ToLowerInvariant(),
            Title = request.Title.Trim(),
            ContentMarkdown = request.ContentMarkdown ?? string.Empty,
            Category = request.Category ?? "General",
            SortOrder = request.SortOrder,
            ParentId = request.ParentId,
            IsPublished = request.IsPublished,
            Tags = request.Tags,
            Icon = request.Icon,
            LastEditedByUserId = userId
        };

        await _repo.AddAsync(page);
        await SaveRevision(page, userId, "Initial version");

        return CreatedAtAction(nameof(GetBySlug), new { slug = page.Slug }, MapToDto(page));
    }

    /// <summary>
    /// Update a wiki page. Automatically saves revision. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(WikiPageFullDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] WikiPageUpdateRequest request)
    {
        var page = await _repo.GetByIdAsync(id);
        if (page == null) return NotFound();

        var userId = int.TryParse(User.FindFirst("id")?.Value, out var uid) ? uid : (int?)null;
        await SaveRevision(page, userId, request.EditSummary);

        if (!string.IsNullOrWhiteSpace(request.Title)) page.Title = request.Title.Trim();
        if (request.ContentMarkdown != null) page.ContentMarkdown = request.ContentMarkdown;
        if (!string.IsNullOrWhiteSpace(request.Category)) page.Category = request.Category;
        if (request.SortOrder.HasValue) page.SortOrder = request.SortOrder.Value;
        if (request.ParentId.HasValue) page.ParentId = request.ParentId.Value == 0 ? null : request.ParentId;
        if (request.IsPublished.HasValue) page.IsPublished = request.IsPublished.Value;
        if (request.Tags != null) page.Tags = request.Tags;
        if (request.Icon != null) page.Icon = request.Icon;
        page.LastEditedByUserId = userId;

        await _repo.UpdateAsync(page);
        return Ok(MapToDto(page));
    }

    /// <summary>
    /// Delete a wiki page. Admin only.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var page = await _repo.GetByIdWithRevisionsAsync(id);
        if (page == null) return NotFound();
        await _repo.DeleteAsync(page);
        return NoContent();
    }

    /// <summary>
    /// Reorder pages within a category. Admin only.
    /// </summary>
    [HttpPost("reorder")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Reorder([FromBody] List<WikiReorderItem> items)
    {
        var ids = items.Select(i => i.Id).ToList();
        var pages = (await _repo.GetByIdsAsync(ids)).ToList();

        foreach (var item in items)
        {
            var page = pages.FirstOrDefault(p => p.Id == item.Id);
            if (page != null)
            {
                page.SortOrder = item.SortOrder;
                if (item.ParentId.HasValue)
                    page.ParentId = item.ParentId.Value == 0 ? null : item.ParentId;
            }
        }

        await _repo.SaveChangesAsync();
        return Ok(new { Updated = pages.Count });
    }

    /// <summary>
    /// Bulk import wiki pages from Docs/*.md files. Admin only.
    /// </summary>
    [HttpPost("import-from-docs")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportFromDocs()
    {
        var docsPath = Path.Combine(Directory.GetCurrentDirectory(), "Docs");
        if (!Directory.Exists(docsPath))
            return BadRequest(new { Message = "Docs directory not found" });

        var files = Directory.GetFiles(docsPath, "*.md");
        var imported = 0;
        var skipped = 0;

        foreach (var file in files)
        {
            var fileName = Path.GetFileNameWithoutExtension(file);
            var slug = "docs/" + fileName.ToLowerInvariant().Replace('_', '-');
            var content = await System.IO.File.ReadAllTextAsync(file);

            var title = fileName;
            var lines = content.Split('\n');
            if (lines.Length > 0 && lines[0].StartsWith("# "))
                title = lines[0][2..].Trim();

            if (await _repo.SlugExistsAsync(slug)) { skipped++; continue; }

            await _repo.AddAsync(new WikiPage
            {
                Slug = slug,
                Title = title,
                ContentMarkdown = content,
                Category = "Docs (importowane)",
                SortOrder = imported,
                IsPublished = true,
                Icon = "file-text"
            });
            imported++;
        }

        return Ok(new { Imported = imported, Skipped = skipped, Total = files.Length });
    }

    // ═══════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════

    private async Task SaveRevision(WikiPage page, int? userId, string? summary)
    {
        var maxRev = await _repo.GetMaxRevisionNumberAsync(page.Id);
        await _repo.AddRevisionAsync(new WikiPageRevision
        {
            WikiPageId = page.Id,
            RevisionNumber = maxRev + 1,
            Title = page.Title,
            ContentMarkdown = page.ContentMarkdown,
            EditSummary = summary,
            EditedByUserId = userId
        });
    }

    private async Task<List<WikiBreadcrumbDto>> BuildBreadcrumbs(WikiPage page)
    {
        var crumbs = new List<WikiBreadcrumbDto>();
        var current = page;
        var visited = new HashSet<int>();

        while (current.ParentId.HasValue && !visited.Contains(current.ParentId.Value))
        {
            visited.Add(current.ParentId.Value);
            current = await _repo.GetByIdAsync(current.ParentId.Value);
            if (current == null) break;
            crumbs.Insert(0, new WikiBreadcrumbDto { Slug = current.Slug, Title = current.Title });
        }

        crumbs.Add(new WikiBreadcrumbDto { Slug = page.Slug, Title = page.Title });
        return crumbs;
    }

    private static List<WikiNavItemDto> BuildTree(List<WikiNavItemDto> all, int? parentId)
    {
        return all
            .Where(p => p.ParentId == parentId)
            .OrderBy(p => p.SortOrder)
            .Select(p =>
            {
                p.Children = BuildTree(all, p.Id);
                return p;
            })
            .ToList();
    }

    private static WikiPageFullDto MapToDto(WikiPage page) => new()
    {
        Id = page.Id, Slug = page.Slug, Title = page.Title,
        ContentMarkdown = page.ContentMarkdown, Category = page.Category,
        SortOrder = page.SortOrder, ParentId = page.ParentId,
        IsPublished = page.IsPublished, Tags = page.Tags, Icon = page.Icon,
        CreatedAt = page.CreatedAt, UpdatedAt = page.UpdatedAt,
        LastEditedByUserId = page.LastEditedByUserId
    };
}

// ═══════════════════════════════════════════════════
//  DTOs
// ═══════════════════════════════════════════════════

file class WikiPageListDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int? ParentId { get; set; }
    public bool IsPublished { get; set; }
    public string? Tags { get; set; }
    public string? Icon { get; set; }
    public DateTime UpdatedAt { get; set; }
}

internal class WikiPageFullDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int? ParentId { get; set; }
    public bool IsPublished { get; set; }
    public string? Tags { get; set; }
    public string? Icon { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int? LastEditedByUserId { get; set; }
    public List<WikiBreadcrumbDto>? Breadcrumbs { get; set; }
    public List<WikiNavItemDto>? Children { get; set; }
}

internal class WikiNavCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public List<WikiNavItemDto> Pages { get; set; } = [];
}

internal class WikiNavItemDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<WikiNavItemDto>? Children { get; set; }
}

internal class WikiBreadcrumbDto
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
}

file class WikiSearchResultDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Tags { get; set; }
    public string Snippet { get; set; } = string.Empty;
}

file class WikiCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public int PageCount { get; set; }
}

file class WikiRevisionListDto
{
    public int Id { get; set; }
    public int RevisionNumber { get; set; }
    public string? EditSummary { get; set; }
    public int? EditedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

file class WikiRevisionDto
{
    public int Id { get; set; }
    public int WikiPageId { get; set; }
    public int RevisionNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string? EditSummary { get; set; }
    public int? EditedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
