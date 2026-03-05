using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A named list of events belonging to a user, organization, or league.
/// Used for favorites, watched lists, location-based grouping, or custom collections.
/// Can be private, shared via link, or fully public.
/// </summary>
public class EventList
{
    public int Id { get; set; }

    /// <summary>Display name (e.g. "Ulubione", "Kraków — piątki", "Sezon letni 2025").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>List type defining its purpose.</summary>
    public EventListType Type { get; set; } = EventListType.Custom;

    /// <summary>Visibility level (private, shared, public).</summary>
    public EventListVisibility Visibility { get; set; } = EventListVisibility.Private;

    /// <summary>Owner user ID (null if owned by organization or league).</summary>
    public int? OwnerUserId { get; set; }

    /// <summary>Owner organization ID (null if owned by user or league).</summary>
    public int? OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>Owner league ID (null if owned by user or organization).</summary>
    public int? LeagueId { get; set; }
    public League? League { get; set; }

    /// <summary>Unique share token for shared/public access.</summary>
    public string ShareToken { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Optional icon name (Font Awesome) for UI display.</summary>
    public string? IconKey { get; set; }

    /// <summary>Optional color hex for UI display (e.g. "#FF5722").</summary>
    public string? Color { get; set; }

    /// <summary>Whether the list is pinned/sticky in UI.</summary>
    public bool IsPinned { get; set; }

    /// <summary>Sort order for displaying multiple lists.</summary>
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Items in this list.</summary>
    public ICollection<EventListItem> Items { get; set; } = new List<EventListItem>();
}
