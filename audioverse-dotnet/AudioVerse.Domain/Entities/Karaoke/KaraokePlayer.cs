namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokePlayer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<KaraokePartyPlayer> PartyPlayers { get; set; } = new();
        public List<KaraokeParty> OrganizedParties { get; set; } = new();
        public List<KaraokePartyRound> Rounds { get; set; } = new();
        public List<KaraokePartyPlayer> KaraokePartyPlayers { get; set; } = new();
        public List<KaraokeSinging> Singing { get; set; } = new();
    }
}
