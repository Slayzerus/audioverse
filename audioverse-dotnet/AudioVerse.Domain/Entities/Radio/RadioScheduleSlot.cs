namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Slot w harmonogramie stacji radiowej — kto mówi, jaka playlista, w jakich godzinach.
/// Wyświetlany publicznie po potwierdzeniu (IsConfirmed = true).
/// </summary>
public class RadioScheduleSlot
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }

    /// <summary>Dzień tygodnia (0=Sunday … 6=Saturday) lub null jeśli jednorazowe.</summary>
    public DayOfWeek? DayOfWeek { get; set; }

    /// <summary>Konkretna data dla slotów jednorazowych (null = cykliczny wg DayOfWeek).</summary>
    public DateTime? SpecificDate { get; set; }

    /// <summary>Godzina startu (UTC).</summary>
    public TimeSpan StartTimeUtc { get; set; }

    /// <summary>Godzina końca (UTC).</summary>
    public TimeSpan EndTimeUtc { get; set; }

    /// <summary>Tytuł audycji / bloku programowego.</summary>
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>ID playlisty przypisanej do tego slotu (opcjonalne).</summary>
    public int? PlaylistId { get; set; }

    /// <summary>ID zaproszenia gościa powiązanego z tym slotem (opcjonalne).</summary>
    public int? InviteId { get; set; }

    /// <summary>ID DJ-a / prowadzącego (user).</summary>
    public int? DjUserId { get; set; }

    /// <summary>Nazwa DJ-a/gościa (jeśli nie ma konta).</summary>
    public string? DjName { get; set; }

    /// <summary>Czy slot jest potwierdzony (widoczny publicznie).</summary>
    public bool IsConfirmed { get; set; }

    /// <summary>Kolor wyświetlany w UI (hex, np. #4f46e5).</summary>
    public string? Color { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
