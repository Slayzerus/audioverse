using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSingings
{
    public class KaraokeSingingNote
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public KaraokeSessionRound Round { get; set; } = null!;
        public string NoteLine { get; set; } = string.Empty;
        public decimal Score { get; set; }
    }
}
