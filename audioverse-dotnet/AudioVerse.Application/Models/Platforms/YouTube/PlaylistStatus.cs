using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class PlaylistStatus
    {
        [JsonPropertyName("privacyStatus")] public string PrivacyStatus { get; set; } = "private"; // public|unlisted|private
    }
}
