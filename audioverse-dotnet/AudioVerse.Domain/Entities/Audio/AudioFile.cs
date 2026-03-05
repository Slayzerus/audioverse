namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Audio file with tag metadata</summary>
    public class AudioFile
    {
        public int Id { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public TimeSpan? Duration { get; set; }
        public int? SampleRate { get; set; }
        public int? Channels { get; set; }
        public int? BitDepth { get; set; }
        public string? AudioMimeType { get; set; }
        public string? Genre { get; set; }
        public int? Year { get; set; }
        public string? Lyrics { get; set; }
        public long Size { get; set; }
        public int? SongId { get; set; }
        public Song? Song { get; set; }
        public int? AlbumId { get; set; }
        public Album? Album { get; set; }

        /// <summary>ID właściciela pliku (np. admin = 1).</summary>
        public int? OwnerId { get; set; }

        /// <summary>Czy plik jest prywatny (widoczny tylko dla właściciela)?</summary>
        public bool IsPrivate { get; set; } = false;
    }
}
