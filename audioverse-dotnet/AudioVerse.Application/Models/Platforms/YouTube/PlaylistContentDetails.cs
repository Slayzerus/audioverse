using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class PlaylistContentDetails
    {
        [JsonPropertyName("itemCount")] public int? ItemCount { get; set; }
    }
}
