using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles
{
    public class KaraokeSongFile
    {
        /// <summary>FK do powiązanej piosenki w katalogu audio (Song). Null = nie dopasowano.</summary>
        public int? LinkedSongId { get; set; }
        public Audio.Song? LinkedSong { get; set; }

        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public string CoverPath { get; set; } = string.Empty;
        public string AudioPath { get; set; } = string.Empty;
        public string VideoPath { get; set; } = string.Empty;
        public int Gap { get; set; } = 0;
        public int VideoGap { get; set; } = 0;
        public int Start { get; set; } = 0;
        public int End { get; set; } = 0;
        // BPM (beats per minute) if available in source file (#BPM:)
        public decimal Bpm { get; set; } = 0m;
        public bool IsVerified { get; set; } = false;
        public bool InDevelopment { get; set; } = false;
        // Optional owner (user profile id). When null, song is public.
        public int? OwnerId { get; set; }
        // If true, anyone can modify; if false, only owner/collaborators can; if null -> public (readable/editable by all)
        public bool? CanBeModifiedByAll { get; set; } = null;

        public KaraokeFormat Format { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public List<KaraokeSongFileNote> Notes { get; set; } = new();

        // External source metadata (import from YouTube/Spotify)
        public string? ExternalSource { get; set; }
        public string? ExternalId { get; set; }
        public string? ExternalCoverUrl { get; set; }
    }
}
