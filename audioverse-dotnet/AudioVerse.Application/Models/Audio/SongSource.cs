namespace AudioVerse.Application.Models.Audio
{
    public class SongSource
    {
        public string Platform { get; set; } = string.Empty; // np. Spotify, Apple Music, YouTube, Amazon
        public string Url { get; set; } = string.Empty; // Link do piosenki w danym serwisie
        public decimal? Price { get; set; }  // Cena zakupu (dla sklepów)
        public string Availability { get; set; } = string.Empty; // np. "Streaming", "Download", "Purchase"
    }
}
