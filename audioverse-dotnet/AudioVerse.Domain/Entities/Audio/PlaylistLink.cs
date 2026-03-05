namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>
    /// External platform link attached to a playlist (e.g., Spotify URI).
    /// </summary>
    public class PlaylistLink
    {
        public int SourcePlaylistId { get; set; }
        public Playlist? SourcePlaylist { get; set; } 

        public int TargetPlaylistId { get; set; }

        public Playlist? TargetPlaylist { get; set; }

        public int OrderNumberStart { get; set; } = 1;
        public int OrderNumberTake { get; set; } = 10;
        public int OrderNumber { get; set; }
        public bool RandomizeOrder { get; set; } = false;
    }
}
