using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public class KaraokeSessionRoundPart
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public KaraokeSessionRound? Round { get; set; }
        public int PartNumber { get; set; }
        public DateTime? PerformedAt { get; set; }
        public List<KaraokeSessionRoundPartPlayer> Players { get; set; } = new();
        public List<KaraokeSinging> Singings { get; set; } = new();
    }
}
