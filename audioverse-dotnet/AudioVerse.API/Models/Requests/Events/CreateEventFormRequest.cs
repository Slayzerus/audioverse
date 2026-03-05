using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>
/// Form-based request model for creating an event with optional poster upload.
/// Used when the client sends multipart/form-data (e.g. when a poster image is attached).
/// </summary>
public class CreateEventFormRequest
{
    /// <summary>Event title / name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Organizer user profile ID.</summary>
    public int? OrganizerId { get; set; }

    /// <summary>Event start time (ISO 8601).</summary>
    public DateTime? StartTime { get; set; }

    /// <summary>Optional end time (ISO 8601).</summary>
    public DateTime? EndTime { get; set; }

    /// <summary>Event type (defaults to Event/Karaoke).</summary>
    public EventType? Type { get; set; }

    /// <summary>Optional poster image file.</summary>
    public IFormFile? Poster { get; set; }
}
