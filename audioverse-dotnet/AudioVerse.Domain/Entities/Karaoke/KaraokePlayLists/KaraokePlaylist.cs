namespace AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists
{
    public class KaraokePlaylist
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<KaraokePlaylistSong> PlaylistSongs { get; set; } = new();
    }

}
