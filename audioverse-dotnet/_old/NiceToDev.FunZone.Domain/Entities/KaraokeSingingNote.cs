namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokeSingingNote
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public KaraokePartyRound Round { get; set; } = null!;        
        public string NoteLine { get; set; } = string.Empty;
        public decimal Score { get; set; }
    }
}
