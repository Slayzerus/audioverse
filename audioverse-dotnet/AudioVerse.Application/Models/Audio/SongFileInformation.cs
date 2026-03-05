namespace AudioVerse.Application.Models.Audio
{
    public sealed class SongFileInformation
    {
        // Identyfikacja / plik
        public string Id { get; set; } = "";
        public required string FilePath { get; init; }
        public required string FileName { get; init; }
        public long FileSizeBytes { get; init; }
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset ModifiedAt { get; init; }
        public string? MimeType { get; init; }
        public string? Codec { get; init; }

        // Czas / właściwości audio
        public double DurationSeconds { get; init; }
        public int BitrateKbps { get; init; }
        public int SampleRateHz { get; init; }
        public int Channels { get; init; }
        public int? BitsPerSample { get; init; }

        // Tag – podstawowe
        public string? Title { get; init; }
        public string? Album { get; init; }
        public uint? Year { get; init; }
        public string[] Artists { get; init; } = Array.Empty<string>();
        public string[] AlbumArtists { get; init; } = Array.Empty<string>();
        public string[] Performers { get; init; } = Array.Empty<string>();
        public string[] Composers { get; init; } = Array.Empty<string>();
        public string[] Genres { get; init; } = Array.Empty<string>();
        public uint? Track { get; init; }
        public uint? TrackCount { get; init; }
        public uint? Disc { get; init; }
        public uint? DiscCount { get; init; }

        // Tag – zaawansowane / identyfikatory
        public string? MusicBrainzTrackId { get; init; }
        public string? MusicBrainzAlbumId { get; init; }
        public string? MusicBrainzArtistId { get; init; }
        public string? MusicBrainzReleaseArtistId { get; init; }
        public string? MusicBrainzReleaseGroupId { get; init; }
        public string? MusicIpId { get; init; }     // AcoustID/MusicDNS jeśli obecne
        public string? ISRC { get; init; }
        public string? Comment { get; init; }
        public string? Lyrics { get; init; }

        // Okładka
        public bool HasEmbeddedCover { get; init; }
        public string? EmbeddedCoverMimeType { get; init; }
        public int? EmbeddedCoverByteLength { get; init; }

        // Dodatkowe pola użytkowe
        public Dictionary<string, string> Extra { get; init; } = new();

        public string CodecDescription { get; set; } = string.Empty;
        public SongFileDetails? Details { get; set; }
        public string AudioMimeType { get; internal set; } = string.Empty;
    }
}
