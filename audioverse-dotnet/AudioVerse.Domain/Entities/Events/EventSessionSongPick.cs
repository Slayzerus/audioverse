namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A session-scoped song from a karaoke playlist. Participants sign up
/// to songs; most popular win limited round slots.
/// </summary>
public class EventSessionSongPick
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }

    /// <summary>Karaoke session this pick belongs to.</summary>
    public int SessionId { get; set; }

    /// <summary>Source playlist this was cloned from (null if added ad-hoc).</summary>
    public int? SourcePlaylistId { get; set; }

    /// <summary>The karaoke song file.</summary>
    public int SongId { get; set; }

    /// <summary>Display name snapshot.</summary>
    public string SongTitle { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<EventSessionSongSignup> Signups { get; set; } = new();
}
