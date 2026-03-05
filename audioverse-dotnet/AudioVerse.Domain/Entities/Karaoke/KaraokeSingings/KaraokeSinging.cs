using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSingings
{
    public class KaraokeSinging
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public KaraokeSessionRound? Round { get; set; } = null;
        // New: part within round (e.g. part index when round split into parts)
        public int? RoundPartId { get; set; }
        public KaraokeSessionRoundPart? RoundPart { get; set; } = null;
        public int PlayerId { get; set; }
        public UserProfilePlayer? Player { get; set; } = null;
        public int Score { get; set; }
        public int Hits { get; set; }
        public int Misses { get; set; }
        public int Good { get; set; }
        public int Perfect { get; set; }
        public int Combo { get; set; }
        public List<KaraokeSingingRecording> Recordings { get; set; } = new();
    }
}
