using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public class KaraokeSessionPlaylist
    {
        public int SessionId { get; set; }
        public KaraokeSession Session { get; set; } = null!;
        public int PlaylistId { get; set; }
        public KaraokePlaylist Playlist { get; set; } = null!;
    }
}
