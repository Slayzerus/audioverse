namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Sesja live voice — DJ mówi na żywo do stacji radiowej.
/// </summary>
public class VoiceSession
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }
    public int? BroadcastSessionId { get; set; }

    /// <summary>ID użytkownika (DJ/admin) który mówi.</summary>
    public int SpeakerUserId { get; set; }

    public DateTime StartUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EndUtc { get; set; }
    public bool IsLive { get; set; }

    /// <summary>Czy nagrywanie jest włączone dla tej sesji.</summary>
    public bool EnableRecording { get; set; }

    /// <summary>Ile segmentów zostało nagranych.</summary>
    public int SegmentCount { get; set; }

    public ICollection<VoiceSegment> Segments { get; set; } = new List<VoiceSegment>();
}
