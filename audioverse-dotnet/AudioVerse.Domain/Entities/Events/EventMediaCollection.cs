namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Media collection within an event (photo album, video set).
/// Each event can have multiple collections.
/// </summary>
public class EventMediaCollection
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverThumbnailKey { get; set; }
    public int OrderNumber { get; set; }
    public EventMediaAccessLevel AccessLevel { get; set; } = EventMediaAccessLevel.Public;
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<EventPhoto> Photos { get; set; } = new();
    public List<EventVideo> Videos { get; set; } = new();
}
