namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokePlayer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<KaraokeParty> Parties { get; set; } = new();
        public List<KaraokeParty> OrganizedParties { get; set; } = new();
        public List<KaraokePartyRound> Rounds { get; set; } = new();
        public List<KaraokeSinging> Singing { get; set; } = new();
    }
}
