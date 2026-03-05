using AudioVerse.Application.Models.Audio;

namespace AudioVerse.Application.Models.SongInformations
{
    public class SongInformation
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Album { get; set; } = string.Empty;
        public int? ReleaseYear { get; set; }
        public string Genre { get; set; } = string.Empty;
        public TimeSpan? Duration { get; set; }
        public string ISRC { get; set; } = string.Empty;
        public string Lyrics { get; set; } = string.Empty;
        public int Popularity { get; set; }
        public List<string> Awards { get; set; } = new();

        public AlbumInformation AlbumDetails { get; set; } = new();
        public ArtistInformation ArtistDetails { get; set; } = new();
        public List<SongSource> Sources { get; set; } = new();
        public Dictionary<string, string> StreamingLinks { get; set; } = new();
    }

}
