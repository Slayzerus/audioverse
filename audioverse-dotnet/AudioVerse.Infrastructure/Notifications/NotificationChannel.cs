namespace AudioVerse.Infrastructure.Notifications;

/// <summary>Channels through which notifications can be dispatched.</summary>
[Flags]
public enum NotificationChannel
{
    None = 0,
    InApp = 1,
    Email = 2,
    Sms = 4,
    All = InApp | Email | Sms
}
