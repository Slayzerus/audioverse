namespace AudioVerse.API.Models.Radio
{
    public class NowPlayingDto
    {
        public int RadioStationId { get; set; }
        public int? BroadcastSessionId { get; set; }
        public int? PlaylistId { get; set; }
        public int? PlaylistItemId { get; set; }
        public int? SongId { get; set; }
        public int? AudioFileId { get; set; }
        public string? Title { get; set; }
        public double PositionSeconds { get; set; }
        public double ItemDurationSeconds { get; set; }
        public DateTime ItemStartedAtUtc { get; set; }
        public AudioVerse.Domain.Entities.Audio.ExternalProvider ExternalProvider { get; set; } = AudioVerse.Domain.Entities.Audio.ExternalProvider.None;
        public string? ExternalId { get; set; }
        public string? ExternalUrl { get; set; }
        // Presigned URL to the locally hosted audio file (MinIO/S3) when available
        public string? PresignedUrl { get; set; }
        // Public direct URL (if bucket is public)
        public string? PublicUrl { get; set; }
        // Streaming URL (HLS) if available (presigned to index.m3u8)
        public string? StreamUrl { get; set; }

        // Spotify deep-link (uri) that clients can use with Web Playback SDK or open in app
        public string? SpotifyUri { get; set; }
        // Suggested start position for Spotify (ms). Client must use Web Playback SDK to seek.
        public int? SpotifyStartMs { get; set; }
    }
}
