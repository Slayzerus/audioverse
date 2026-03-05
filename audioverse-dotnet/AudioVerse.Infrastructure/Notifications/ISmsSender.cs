namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// SMS gateway interface. Implementations: SmsApiSmsSender (SMSAPI.pl).
/// </summary>
public interface ISmsSender
{
    bool IsConfigured { get; }
    Task SendAsync(string phoneNumber, string message, CancellationToken ct = default);
}
