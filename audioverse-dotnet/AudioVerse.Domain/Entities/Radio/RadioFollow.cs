namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Obserwowanie stacji radiowej przez użytkownika (follow / subskrypcja powiadomień).
/// </summary>
public class RadioFollow
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }
    public int UserId { get; set; }

    /// <summary>Czy użytkownik chce otrzymywać powiadomienia (nowy DJ, zmiana ramówki).</summary>
    public bool NotifyOnScheduleChange { get; set; } = true;
    public bool NotifyOnLiveVoice { get; set; } = true;

    public DateTime FollowedAtUtc { get; set; } = DateTime.UtcNow;
}
