namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Zaproszenie gościa do mówienia na żywo na stacji radiowej.
/// Token wysyłany na e-mail, ważny w określonym oknie czasowym.
/// </summary>
public class RadioStationInvite
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }

    /// <summary>ID admina/właściciela który wysłał zaproszenie.</summary>
    public int InvitedByUserId { get; set; }

    /// <summary>Adres e-mail gościa.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Unikalny token do weryfikacji (UUID).</summary>
    public string Token { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Opcjonalna wiadomość od zapraszającego.</summary>
    public string? Message { get; set; }

    /// <summary>Nazwa gościa (wypełniana po akceptacji).</summary>
    public string? GuestName { get; set; }

    /// <summary>Początek okna czasowego w którym gość może mówić.</summary>
    public DateTime ValidFrom { get; set; }

    /// <summary>Koniec okna czasowego.</summary>
    public DateTime ValidTo { get; set; }

    public RadioInviteStatus Status { get; set; } = RadioInviteStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
