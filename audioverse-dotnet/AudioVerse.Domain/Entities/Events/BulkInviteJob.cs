namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Bulk invitation job. Tracks progress and errors.
/// </summary>
public class BulkInviteJob
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public int TemplateId { get; set; }
    public EventInviteTemplate? Template { get; set; }
    public int? CreatedByUserId { get; set; }
    public int TotalContacts { get; set; }
    public int Sent { get; set; }
    public int Failed { get; set; }
    public BulkInviteStatus Status { get; set; } = BulkInviteStatus.Pending;
    public string? ErrorLog { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
