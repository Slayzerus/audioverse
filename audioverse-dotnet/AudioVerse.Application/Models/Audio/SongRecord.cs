namespace AudioVerse.Application.Models.Audio
{
    public class SongRecord
    {
        // ===== Kanoniczne (po scaleniu) =====
        public string Id { get; set; } = "";
        public string Title { get; set; } = "";
        public string[] Artists { get; set; } = Array.Empty<string>();
        public string Album { get; set; } = "";
        public int? Year { get; set; }
        public double? DurationSeconds { get; set; }
        public string[] Genres { get; set; } = Array.Empty<string>();
        public string ISRC { get; set; } = "";
        public string Lyrics { get; set; } = "";

        // ===== Dane pliku / techniczne =====
        public string FilePath { get; set; } = "";
        public string FileName { get; set; } = "";
        public long FileSizeBytes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ModifiedAt { get; set; }
        public string AudioMimeType { get; set; } = "";        // z TagLib.File.MimeType
        public string CodecDescription { get; set; } = "";     // z Properties.Codecs
        public int BitrateKbps { get; set; }
        public int SampleRateHz { get; set; }
        public int Channels { get; set; }
        public int? BitsPerSample { get; set; }

        // Identyfikatory z tagów
        public string? MusicBrainzTrackId { get; set; }
        public string? MusicBrainzAlbumId { get; set; }
        public string? MusicBrainzArtistId { get; set; }
        public string? MusicBrainzReleaseArtistId { get; set; }
        public string? MusicBrainzReleaseGroupId { get; set; }

        // Okładka
        public bool HasEmbeddedCover { get; set; }
        public string? EmbeddedCoverMimeType { get; set; }
        public int? EmbeddedCoverByteLength { get; set; }

        // Analiza sygnału
        public SongFileDetails? Analysis { get; set; }

        // ===== Enrichment online =====
        public Dictionary<string, string> StreamingLinks { get; set; } = new(); // Spotify/Tidal/YouTube...
        public AlbumInformation AlbumDetails { get; set; } = new();
        public ArtistInformation ArtistDetails { get; set; } = new();

        // Dodatki
        public Dictionary<string, string> Extra { get; set; } = new();
    }
}
