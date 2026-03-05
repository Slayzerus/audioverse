namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Wiadomość na chacie stacji radiowej (real-time przez SignalR).
/// </summary>
public class RadioChatMessage
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }
    public int? UserId { get; set; }

    /// <summary>Nazwa wyświetlana (user lub gość).</summary>
    public string DisplayName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    /// <summary>Typ wiadomości: text, system, dj.</summary>
    public string MessageType { get; set; } = "text";

    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Czy wiadomość została usunięta przez moderatora.</summary>
    public bool IsDeleted { get; set; }
}
