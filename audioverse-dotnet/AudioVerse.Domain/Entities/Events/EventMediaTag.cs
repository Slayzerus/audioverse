using AudioVerse.Domain.Entities.Contacts;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Tagging a person in an event photo or video.
/// On photo: X/Y coordinates (normalized 0.0–1.0).
/// On video: X/Y coordinates + TimestampSeconds.
/// </summary>
public class EventMediaTag
{
    public int Id { get; set; }
    public int? PhotoId { get; set; }
    public EventPhoto? Photo { get; set; }
    public int? VideoId { get; set; }
    public EventVideo? Video { get; set; }
    public int? ContactId { get; set; }
    public Contact? Contact { get; set; }
    public int? UserId { get; set; }
    public UserProfile? User { get; set; }
    public string? Label { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public int? TimestampSeconds { get; set; }
    public int? TaggedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
