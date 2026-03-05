namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Event video stored in MinIO. Supports streaming via range requests.
/// </summary>
public class EventVideo
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public int? CollectionId { get; set; }
    public EventMediaCollection? Collection { get; set; }
    public string ObjectKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = "video/mp4";
    public long FileSizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ThumbnailKey { get; set; }
    public int? UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? OriginalId { get; set; }
    public EventVideo? Original { get; set; }
    public string? FiltersJson { get; set; }
}
