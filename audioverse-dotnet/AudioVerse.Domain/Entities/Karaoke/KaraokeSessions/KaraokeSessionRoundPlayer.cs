using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public class KaraokeSessionRoundPlayer
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public KaraokeSessionRound? Round { get; set; }
        public int PlayerId { get; set; }
        public UserProfilePlayer? Player { get; set; }
        // Optional ordering/slot number within the round
        public int Slot { get; set; }
        public DateTime? JoinedAt { get; set; }
        /// <summary>Browser microphone deviceId assigned to this player (nullable).</summary>
        public string? MicDeviceId { get; set; }
    }
}
