namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

/// <summary>
/// A participant signing up to perform a karaoke song.
/// Signup count determines which songs make it into limited rounds.
/// </summary>
public class KaraokeSessionSongSignup
{
    public int Id { get; set; }
    public int PickId { get; set; }
    public KaraokeSessionSongPick? Pick { get; set; }

    /// <summary>Player who wants to sing this song.</summary>
    public int PlayerId { get; set; }
    public UserProfiles.UserProfilePlayer? Player { get; set; }

    /// <summary>Preferred round/slot number (optional).</summary>
    public int? PreferredSlot { get; set; }

    public DateTime SignedUpAt { get; set; } = DateTime.UtcNow;
}
