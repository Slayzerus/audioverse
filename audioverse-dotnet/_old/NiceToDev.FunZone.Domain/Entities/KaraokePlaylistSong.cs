namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokePlaylistSong
    {
        public int PlaylistId { get; set; }
        public KaraokePlaylist Playlist { get; set; } = null!;
        public int SongId { get; set; }
        public KaraokeSongFile Song { get; set; } = null!;
    }
}
