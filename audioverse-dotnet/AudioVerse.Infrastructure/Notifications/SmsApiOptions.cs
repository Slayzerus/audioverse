namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// Configuration options for SMSAPI.pl SMS gateway.
/// </summary>
public class SmsApiOptions
{
    public string? ApiToken { get; set; }
    public string BaseUrl { get; set; } = "https://api.smsapi.pl";
    public string? DefaultSenderName { get; set; } = "AudioVerse";
}
