using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles
{
    public class KaraokeSongFileQueueItem
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int SongId { get; set; }
        public KaraokeSongFile? Song { get; set; }
        public int RequestedByPlayerId { get; set; }
        public UserProfilePlayer? RequestedByPlayer { get; set; }
        public int Position { get; set; }
        public SongQueueStatus Status { get; set; }
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    }
}
