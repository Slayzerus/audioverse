namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>
    /// Single item (song reference) within a playlist with ordering.
    /// </summary>
    public class PlaylistItem
    {
        public int Id { get; set; }
        public int PlaylistId { get; set; }
        public Playlist? Playlist { get; set; }
        public int OrderNumber { get; set; }
        public int SkipMs { get; set; }
        public int SongId { get; set; }
        public Song? Song { get; set; }
        // Optional override of duration in milliseconds. If null, use AudioFile.Duration
        public int? DurationMs { get; set; }

        // External provider info (Spotify / YouTube) — used to provide links
        public ExternalProvider ExternalProvider { get; set; } = ExternalProvider.None;
        public string? ExternalId { get; set; }
        public bool IsRequest { get; set; } = false;
    }
}