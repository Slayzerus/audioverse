using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class LyricsLine
    {
        [JsonPropertyName("startMs")] public int StartMs { get; set; }
        [JsonPropertyName("endMs")] public int EndMs { get; set; }
        [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
    }
}
