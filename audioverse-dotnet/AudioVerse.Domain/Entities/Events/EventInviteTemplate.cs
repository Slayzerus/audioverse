namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Invitation template assigned to an organization or event.
/// Template fields support placeholders: {GuestName}, {EventName}, {EventDate}, {InviteUrl}.
/// </summary>
public class EventInviteTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public int? EventId { get; set; }
    public Event? Event { get; set; }
    public string? NotificationTemplate { get; set; }
    public string? EmailSubjectTemplate { get; set; }
    public string? EmailTemplate { get; set; }
    public string? SmsTemplate { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
