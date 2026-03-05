using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public class KaraokeSessionRound
    {
        public int Id { get; set; }
        public int? EventId { get; set; }
        public Event? Event { get; set; } = null;
        // New: rounds belong to a session (multiple sessions can exist per party)
        public int? SessionId { get; set; }
        public KaraokeSession? Session { get; set; } = null;
        public int? PlaylistId { get; set; }
        public KaraokePlaylist? Playlist { get; set; } = null;
        public int SongId { get; set; }
        public KaraokeSongFile? Song { get; set; } = null;        
        public int Number { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PerformedAt { get; set; }
        public List<KaraokeSinging> Singing { get; set; } = new();
        public List<KaraokeSessionRoundPart> Parts { get; set; } = new();
        // Players assigned to this round (order/slot)
        public List<KaraokeSessionRoundPlayer> Players { get; set; } = new();
        public bool TeamMode { get; set; }
        public KaraokeRoundMode Mode { get; set; } = KaraokeRoundMode.Normal;
        public int? DurationLimitSeconds { get; set; }
    }
}
