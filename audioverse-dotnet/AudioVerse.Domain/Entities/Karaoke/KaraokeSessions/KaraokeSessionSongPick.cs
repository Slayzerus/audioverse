namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

/// <summary>
/// A song from a KaraokePlaylist snapshotted into a session.
/// Participants sign up to perform it. Songs with most signups
/// win limited round slots.
/// </summary>
public class KaraokeSessionSongPick
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public KaraokeSession? Session { get; set; }

    /// <summary>Source playlist this was imported from (null if added ad-hoc).</summary>
    public int? SourcePlaylistId { get; set; }

    /// <summary>FK to the karaoke song file.</summary>
    public int SongId { get; set; }
    public KaraokeSongFiles.KaraokeSongFile? Song { get; set; }

    /// <summary>Snapshot of title at import time.</summary>
    public string SongTitle { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<KaraokeSessionSongSignup> Signups { get; set; } = new();
}
