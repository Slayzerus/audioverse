namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Collage — composition of photos and videos arranged in 2D/3D space.
/// Z axis allows multiple pages/layers (e.g. page 0, page 1...).
/// </summary>
public class EventCollage
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Width { get; set; } = 1920;
    public int Height { get; set; } = 1080;
    public string? BackgroundColor { get; set; }
    public string? BackgroundImageKey { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<EventCollageItem> Items { get; set; } = new();
}
