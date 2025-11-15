using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokeSongFile
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public string CoverPath { get; set; } = string.Empty;
        public string AudioPath { get; set; } = string.Empty;
        public string VideoPath { get; set; } = string.Empty;

        public KaraokeFormat Format { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public List<KaraokeNote> Notes { get; set; } = new();
    }
}
