using System.Text.Json;

namespace AudioVerse.Application.Models.Utils
{   
    public class PitchData
    {
        public int TrackId { get; set; }
        public string Lyrics { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int LyricsLength { get; set; }
        public bool Explicit { get; set; }
        public DateTime UpdatedTime { get; set; }

        public PitchData(JsonDocument json)
        {
            try
            {
                var message = json.RootElement.GetProperty("message").GetProperty("body");
                var lyricsElement = message.GetProperty("lyrics");

                TrackId = lyricsElement.GetProperty("track_id").GetInt32();
                Lyrics = lyricsElement.GetProperty("lyrics_body").GetString() ?? string.Empty;
                Language = lyricsElement.GetProperty("lyrics_language").GetString() ?? string.Empty ;
                LyricsLength = lyricsElement.GetProperty("lyrics_length").GetInt32();
                Explicit = lyricsElement.GetProperty("explicit").GetInt32() == 1;
                UpdatedTime = DateTime.Parse(lyricsElement.GetProperty("updated_time").GetString() ?? DateTime.Now.ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing PitchData: {ex.Message}");
            }
        }

        public override string ToString()
        {
            return $"Track ID: {TrackId}\nLanguage: {Language}\nExplicit: {Explicit}\nLyrics Length: {LyricsLength}\nLast Updated: {UpdatedTime}\nLyrics:\n{Lyrics}";
        }
    }

}
