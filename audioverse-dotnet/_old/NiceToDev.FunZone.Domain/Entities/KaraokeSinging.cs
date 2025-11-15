namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokeSinging
    {
        public int RoundId { get; set; }
        public KaraokePartyRound Round { get; set; } = null!;
        public int PlayerId { get; set; }
        public KaraokePlayer Player { get; set; } = null!;
        public int Score { get; set; }
        public int Hits { get; set; }
        public int Misses { get; set; }
        public int Good { get; set; }
        public int Perfect { get; set; }
        public int Combo { get; set; }
        public List<KaraokeSingingRecording> Recordings { get; set; } = new();
    }
}
