namespace AudioVerse.Domain.Entities.Admin;

/// <summary>
/// Wiki page stored in the database, editable by admins and served to frontend.
/// </summary>
public class WikiPage
{
    public int Id { get; set; }

    /// <summary>
    /// URL-friendly slug (e.g. "getting-started", "karaoke/scoring").
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Page title displayed in navigation and headings.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Markdown content of the page.
    /// </summary>
    public string ContentMarkdown { get; set; } = string.Empty;

    /// <summary>
    /// Category for grouping (e.g. "API", "Karaoke", "Admin", "Setup").
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Sort order within a category (lower = first).
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Optional parent page ID for tree structure.
    /// </summary>
    public int? ParentId { get; set; }
    public WikiPage? Parent { get; set; }
    public List<WikiPage> Children { get; set; } = [];

    /// <summary>
    /// Whether this page is visible to non-admin users.
    /// </summary>
    public bool IsPublished { get; set; } = true;

    /// <summary>
    /// Optional comma-separated tags for search.
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// Icon name for navigation (e.g. "home", "code", "music", "gamepad").
    /// </summary>
    public string? Icon { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? LastEditedByUserId { get; set; }

    public List<WikiPageRevision> Revisions { get; set; } = [];
}
