using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class Lyrics
    {
        [JsonPropertyName("trackId")] public string TrackId { get; set; } = string.Empty;
        [JsonPropertyName("lines")] public List<LyricsLine> Lines { get; set; } = new();
    }
}
