namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokePartyPlaylist
    {
        public int PartyId { get; set; }
        public KaraokeParty Party { get; set; } = null!;
        public int PlaylistId { get; set; }
        public KaraokePlaylist Playlist { get; set; } = null!;
    }
}
