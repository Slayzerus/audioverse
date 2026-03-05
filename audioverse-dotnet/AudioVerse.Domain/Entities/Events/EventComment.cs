namespace AudioVerse.Domain.Entities.Events;

public class EventComment
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public int UserId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public EventComment? Parent { get; set; }
    public List<EventComment> Replies { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
