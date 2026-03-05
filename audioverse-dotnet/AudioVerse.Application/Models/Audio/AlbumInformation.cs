namespace AudioVerse.Application.Models.Audio
{
    public class AlbumInformation
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public DateTime? ReleaseDate { get; set; }
        public string Genre { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public List<string> TrackList { get; set; } = new();
        public string CoverUrl { get; set; } = string.Empty;
        /*public Dictionary<string, string> StreamingLinks { get; set; } = new();*/
    }

}
