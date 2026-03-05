using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public class KaraokeSessionPlayer
    {
        public int Id { get; set; }
        public int? EventId { get; set; }
        public Event? Event { get; set; }
        public int PlayerId { get; set; }
        public UserProfilePlayer? Player { get; set; }
        public KaraokePlayerStatus Status { get; set; } = KaraokePlayerStatus.None;
        // Permissions allow granting specific capabilities to party participants
        public EventPermission Permissions { get; set; } = EventPermission.None;
    }
}
