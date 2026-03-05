namespace AudioVerse.Domain.Entities.Admin;

/// <summary>
/// Revision history entry for a wiki page. Created automatically on every update.
/// </summary>
public class WikiPageRevision
{
    public int Id { get; set; }

    public int WikiPageId { get; set; }
    public WikiPage? WikiPage { get; set; }

    /// <summary>
    /// Incremental revision number within a page (1, 2, 3...).
    /// </summary>
    public int RevisionNumber { get; set; }

    /// <summary>
    /// Full markdown snapshot at this revision.
    /// </summary>
    public string ContentMarkdown { get; set; } = string.Empty;

    /// <summary>
    /// Title at this revision.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional edit summary.
    /// </summary>
    public string? EditSummary { get; set; }

    public int? EditedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
