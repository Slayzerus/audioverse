using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public class KaraokeSessionRoundPartPlayer
    {
        public int Id { get; set; }
        public int RoundPartId { get; set; }
        public KaraokeSessionRoundPart? RoundPart { get; set; }
        public int PlayerId { get; set; }
        public UserProfilePlayer? Player { get; set; }
        // Optional ordering/slot number within the round
        public int Slot { get; set; }
        public DateTime? JoinedAt { get; set; }
    }
}
