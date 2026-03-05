namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// An item in an EventList linking to a specific event.
/// Supports custom notes, tags, and sort order per list.
/// </summary>
public class EventListItem
{
    public int Id { get; set; }

    /// <summary>Parent list ID.</summary>
    public int EventListId { get; set; }
    public EventList EventList { get; set; } = null!;

    /// <summary>Referenced event ID.</summary>
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    /// <summary>Optional personal note about this event in the list.</summary>
    public string? Note { get; set; }

    /// <summary>Optional tags for filtering within the list (comma-separated).</summary>
    public string? Tags { get; set; }

    /// <summary>Sort order within the list.</summary>
    public int SortOrder { get; set; }

    /// <summary>User who added this item (for shared/org lists with multiple contributors).</summary>
    public int? AddedByUserId { get; set; }

    /// <summary>Whether the user is actively observing/subscribed to notifications for this event.</summary>
    public bool IsObserved { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
