namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Generic media file (video, image, etc.)</summary>
    public class MediaFile
    {
        public int Id { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string? MimeType { get; set; }
        public string? Codec { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ModifiedAt { get; set; } = DateTimeOffset.UtcNow;
        public int? SongId { get; set; }
        public Song? Song { get; set; }
        public int? AlbumId { get; set; }
        public Album? Album { get; set; }
    }
}
