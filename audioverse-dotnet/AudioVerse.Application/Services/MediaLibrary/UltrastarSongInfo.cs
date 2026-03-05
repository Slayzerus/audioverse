namespace AudioVerse.Application.Services.MediaLibrary
{
    public class UltrastarSongInfo
    {
        public string? FilePath { get; set; }
        public string? Title { get; set; }
        public string? Artist { get; set; }
        public string? Genre { get; set; }
        public string? Language { get; set; }
        public int? Year { get; set; }
        public string? CoverPath { get; set; }
        public string? AudioPath { get; set; }
        public string? VideoPath { get; set; }
        public int? Bpm { get; set; }
        public int? Gap { get; set; }
    }
}
