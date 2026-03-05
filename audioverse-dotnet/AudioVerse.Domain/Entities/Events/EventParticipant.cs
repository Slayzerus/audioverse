using AudioVerse.Domain.Diagrams;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// User-level participant in an event (RSVP / attendance tracking).
/// This is separate from KaraokeSessionPlayer which tracks players at the session/round level.
/// </summary>
[DiagramNode("Events", FillColor = "#d5e8d4", StrokeColor = "#82b366", Icon = "🎟️", Description = "RSVP / attendance tracking")]
public class EventParticipant
{
    public int Id { get; set; }

    /// <summary>Event the user signed up for.</summary>
    public int EventId { get; set; }
    [DiagramRelation(Label = "N:1")]
    public Event? Event { get; set; }

    /// <summary>User who signed up (UserProfile.Id).</summary>
    public int UserId { get; set; }
    [DiagramRelation(Label = "N:1")]
    public UserProfile? User { get; set; }

    /// <summary>Attendance status lifecycle: Registered → Waiting → Inside → Left.</summary>
    public EventParticipantStatus Status { get; set; } = EventParticipantStatus.Registered;

    /// <summary>When the user RSVP'd.</summary>
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the user arrived (null if not yet).</summary>
    public DateTime? ArrivedAt { get; set; }
}
