using AudioVerse.Domain.Diagrams;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Core event entity representing a scheduled gathering.
/// Can be associated with a KaraokeEvent, board games, or other activities.
/// </summary>
[DiagramNode("Events", FillColor = "#d5e8d4", StrokeColor = "#82b366", Icon = "📅", Description = "Core event - scheduled gathering")]
public class Event : ISoftDeletable
{
    public int Id { get; set; }

    /// <summary>Event title displayed to users.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Optional description with event details.</summary>
    public string? Description { get; set; }

    /// <summary>Type of event (party, meeting, game night, etc.).</summary>
    public EventType Type { get; set; } = EventType.Event;

    /// <summary>Event start time in UTC.</summary>
    public DateTime? StartTime { get; set; }

    /// <summary>Optional end time in UTC.</summary>
    public DateTime? EndTime { get; set; }

    /// <summary>User ID of the event organizer.</summary>
    public int? OrganizerId { get; set; }

    /// <summary>Maximum number of participants (null = unlimited).</summary>
    public int? MaxParticipants { get; set; }

    /// <summary>Whether to enable waiting list when max participants reached.</summary>
    public bool WaitingListEnabled { get; set; }

    /// <summary>Visibility level (private, unlisted, public).</summary>
    public EventVisibility Visibility { get; set; } = EventVisibility.Private;

    // ── Soft delete ──
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? DeletedByUserId { get; set; }

    /// <summary>Foreign key to event location.</summary>
    public int? LocationId { get; set; }
    
    /// <summary>Navigation property to location details.</summary>
    public EventLocation? Location { get; set; }
    // --- Event compatibility fields (will help migrate Event -> Event)
    /// <summary>Optional human-readable location string (from Event)</summary>
    public string? LocationName { get; set; }

    /// <summary>Event status (for party lifecycle)</summary>
    public AudioVerse.Domain.Enums.EventStatus Status { get; set; } = AudioVerse.Domain.Enums.EventStatus.Created;

    /// <summary>Event location type (virtual / real)</summary>
    public AudioVerse.Domain.Enums.EventLocationType LocationType { get; set; } = AudioVerse.Domain.Enums.EventLocationType.Virtual;

    /// <summary>Access type for party (public/private/code/link)</summary>
    public AudioVerse.Domain.Enums.EventAccessType Access { get; set; } = AudioVerse.Domain.Enums.EventAccessType.Public;

    /// <summary>Hash of access code (if Access == Code)</summary>
    public string? CodeHash { get; set; }

    /// <summary>Access token (link-based access)</summary>
    public string? AccessToken { get; set; }

    /// <summary>Poster image path stored in object storage (MinIO)</summary>
    public string? Poster { get; set; }

    // ── Recurring events ──

    /// <summary>Whether this event recurs (weekly, bi-weekly, monthly, etc.).</summary>
    public RecurrencePattern? Recurrence { get; set; }

    /// <summary>How many days/weeks between occurrences (e.g. 1 = every week, 2 = bi-weekly).</summary>
    public int? RecurrenceInterval { get; set; }

    /// <summary>Parent event ID for recurring series (null if standalone or parent).</summary>
    public int? SeriesParentId { get; set; }

    /// <summary>Navigation to the parent event of a recurring series.</summary>
    public Event? SeriesParent { get; set; }

    /// <summary>Whether to carry over un-picked proposals to the next occurrence.</summary>
    public bool CarryOverProposals { get; set; }

    /// <summary>Reason when this specific occurrence was cancelled.</summary>
    public string? CancellationReason { get; set; }

    /// <summary>Original date before this occurrence was rescheduled (null if not rescheduled).</summary>
    public DateTime? OriginalStartTime { get; set; }


    /// <summary>Navigation to associated karaoke party (if Type == Event).</summary>
    /// <summary>Compatibility: Name alias for Title used by legacy Event-based code.</summary>
    public string Name { get => Title; set => Title = value; }

    /// <summary>Navigation to the organizer user profile.</summary>
    [DiagramRelation(Label = "N:1")]
    public AudioVerse.Domain.Entities.UserProfiles.UserProfile? Organizer { get; set; }

    /// <summary>Tabs controlling UI section visibility for participants and guests.</summary>
    public List<EventTab> Tabs { get; set; } = new();
}
