namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokeParty
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrganizerId { get; set; }
        public KaraokePlayer Organizer { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public List<KaraokePartyPlaylist> PartyPlaylists { get; set; } = new();
        public List<KaraokePlaylist> Playlists => PartyPlaylists.Select(pp => pp.Playlist).ToList();
        public List<KaraokePartyPlayer> PartyPlayers { get; set; } = new();
        public List<KaraokePlayer> Players => PartyPlayers.Select(pp => pp.Player).ToList();
    }
}
