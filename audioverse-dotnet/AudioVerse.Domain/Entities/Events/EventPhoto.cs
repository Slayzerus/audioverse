namespace AudioVerse.Domain.Entities.Events;

public class EventPhoto
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public int? CollectionId { get; set; }
    public EventMediaCollection? Collection { get; set; }
    public string ObjectKey { get; set; } = string.Empty;
    public string? ThumbnailKey { get; set; }
    public string? Caption { get; set; }
    public int? UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Self-reference: points to the original (unfiltered) photo this was derived from
    public int? OriginalId { get; set; }
    public EventPhoto? Original { get; set; }
    // JSON array of applied filters in order, e.g. ["pixelart","tint-gold"]
    public string? FiltersJson { get; set; }
}
