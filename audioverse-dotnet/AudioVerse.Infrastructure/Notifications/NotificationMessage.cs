namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// Represents a notification message to be dispatched via one or more channels.
/// </summary>
public class NotificationMessage
{
    public int? UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public NotificationChannel Channels { get; set; } = NotificationChannel.InApp;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Category { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
}
