namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokePartyPlayer
    {
        public int PartyId { get; set; }
        public KaraokeParty Party { get; set; } = null!;
        public int PlayerId { get; set; }
        public KaraokePlayer Player { get; set; } = null!;
    }
}
