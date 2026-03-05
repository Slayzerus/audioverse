namespace AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists
{
    public class KaraokePlaylistLink
    {
        public int SourcePlaylistId { get; set; }
        public KaraokePlaylist? SourcePlaylist { get; set; }

        public int TargetPlaylistId { get; set; }

        public KaraokePlaylist? TargetPlaylist { get; set; }
        public int OrderNumberStart { get; set; } = 1;
        public int OrderNumberTake { get; set; } = 10;
        public int OrderNumber { get; set; }
        public bool RandomizeOrder { get; set; } = false;
    }
}
