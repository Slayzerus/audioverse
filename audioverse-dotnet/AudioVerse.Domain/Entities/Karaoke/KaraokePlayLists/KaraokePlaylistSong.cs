using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists
{
    public class KaraokePlaylistSong
    {
        public int PlaylistId { get; set; }
        public KaraokePlaylist Playlist { get; set; } = null!;
        public int SongId { get; set; }
        public KaraokeSongFile Song { get; set; } = null!;
    }
}
